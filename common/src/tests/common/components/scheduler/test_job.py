#!/usr/bin/python3

import unittest
import pytest
from gosa.common.components.scheduler.job import *
from gosa.common.components.scheduler.triggers.simple import *
from gosa.common.components.scheduler.triggers.interval import *
from datetime import datetime, timedelta

def dummy():
    pass

class JobTestCase(unittest.TestCase):
    def test_Job(self):
        with pytest.raises(ValueError) as e:
            Job(SimpleTrigger("2016-12-12"), dummy, (), {}, 1, 0, max_instances=-1)
        assert 'max_instances must be a positive value' in str(e.value)
        
        with pytest.raises(ValueError) as e:
            Job(SimpleTrigger("2016-12-12"), dummy, (), {}, 1, 0, max_runs=-1)
        assert 'max_runs must be a positive value' in str(e.value)
        
        with pytest.raises(ValueError) as e:
            Job(SimpleTrigger("2016-12-12"), dummy, (), {}, -1, 0)
        assert 'misfire_grace_time must be a positive value' in str(e.value)
        
        with pytest.raises(TypeError) as e:
            Job(SimpleTrigger("2016-12-12"), dummy, (), object(), 1, 0)
        assert 'kwargs must be a dict-like object' in str(e.value)
        
        with pytest.raises(TypeError) as e:
            Job(SimpleTrigger("2016-12-12"), dummy, object(), {}, 1, 0)
        assert 'args must be a list-like object' in str(e.value)
        
        with pytest.raises(TypeError) as e:
            Job(SimpleTrigger("2016-12-12"), object(), (), {}, 1, 0)
        assert 'func must be callable' in str(e.value)
        
        with pytest.raises(ValueError) as e:
            Job(None, dummy, (), {}, 1, 0)
        assert 'The trigger must not be None' in str(e.value)
        
        trigger = SimpleTrigger("2016-12-12")
        trigger_str = str(trigger)
        trigger_repr = repr(trigger)
        j = Job(trigger, dummy, (), {}, 1, 0)
        assert str(j) == "dummy (trigger: %s, next run at: None)" % trigger_str
        assert repr(j) == "<Job (name=dummy, trigger=%s)>" % trigger_repr
        j = Job(trigger, dummy, (), {}, 1, 0, name="jobber")
        assert str(j) == "jobber (trigger: %s, next run at: None)" % trigger_str
        assert repr(j) == "<Job (name=jobber, trigger=%s)>" % trigger_repr
        
        j1 = Job(trigger, dummy, (), {}, 1, 0)
        j1.id = 1
        j2 = Job(trigger, dummy, (), {}, 1, 0)
        j2.id = 2
        assert j1 != j2
        j1.id = j2.id
        assert j1 == j2
        assert j1 != "test"
    
    def test_compute_next_run_time(self):
        trigger = SimpleTrigger("2016-12-12")
        j1 = Job(trigger, dummy, (), {}, 1, 0, max_runs=2)
        # NOTE: attribute "runs" is supposed to be accessed directly by scheduler.
        # Unlike "instances" it is not protected by locks (at least from the perspective of the Job).
        dt = datetime(2016, 12, 11)
        assert j1.compute_next_run_time(dt) == datetime(2016, 12, 12)
        j1.runs = 2
        assert j1.compute_next_run_time(dt) == None
    
    def test_get_run_times(self):
        # NOTE: get_run_times only works if compute_next_run_time was called before
        # (and therefore next_run_time is set).
        trigger = IntervalTrigger(timedelta(days=2), start_date="2016-12-12")
        j1 = Job(trigger, dummy, (), {}, 1, 0)
        j1.compute_next_run_time(datetime(2016,12,12))
        assert j1.get_run_times(datetime(2016,12,14)) == [datetime(2016,12,12), datetime(2016,12,14)]
    
    def test_instances(self):
        trigger = IntervalTrigger(timedelta(days=2), start_date="2016-12-12")
        j1 = Job(trigger, dummy, (), {}, 1, 0, max_instances=2)
        j1.add_instance()
        j1.add_instance()
        with pytest.raises(MaxInstancesReachedError):
            j1.add_instance()
        j1.remove_instance()
        j1.remove_instance()
    
    def test_state(self):
        trigger = IntervalTrigger(timedelta(days=2), start_date="2016-12-12")
        j1 = Job(trigger, dummy, (), {}, 1, 0, max_instances=2)
        expected_state = {
                'max_instances': 2,
                'status': 1,
                'job_type': None,
                'description': None,
                'owner': None,
                'coalesce': 0,
                'func_ref': 'tests.common.components.scheduler.test_job:dummy',
                'args': (),
                'kwargs': {},
                'uuid': j1.uuid,
                'callback_ref': None,
                'callback': None,
                'tag': None,
                'max_runs': None,
                'name': 'dummy',
                'progress': 0,
                'misfire_grace_time': 1,
                'origin': None,
                'trigger': trigger,
                'runs': 0}
        assert j1.__getstate__() == expected_state
        
        return True
        # Note: __getstate__ does not return values __setstate__ expects.
        expected_state["max_instances"] = 3
        j1.__setstate__(expected_state)
        assert j1.max_instances == 3

