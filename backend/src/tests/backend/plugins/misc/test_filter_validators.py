# This file is part of the GOsa framework.
#
#  http://gosa-project.org
#
# Copyright:
#  (C) 2016 GONICUS GmbH, Germany, http://www.gonicus.de
#
# See the LICENSE file in the project's top-level directory for details.

import unittest
from gosa.backend.plugins.misc.filter_validators import *

class FilterValidatorTests(unittest.TestCase):

    def test_IsValidHostName(self):
        filter = IsValidHostName()
        (res, errors) = filter.process(None, None, ["www.gonicus.de"])
        assert res == True
        assert len(errors) == 0

        (res, errors) = filter.process(None, None, ["1www.gonicus.de"])
        assert res == False
        assert len(errors) == 1

    @unittest.mock.patch.object(PluginRegistry, 'getInstance')
    def test_IsExistingDN(self, mockedRegistry):
        # mockup ObjectIndex.search
        mockedRegistry.return_value.search.return_value = []

        # start the tests
        filter = IsExistingDN()
        props = { 'test': {
            'value': ['test']
        }}
        (res, errors) = filter.process(props, 'test', ["test"])
        assert res is False
        assert len(errors) == 1

        mockedRegistry.return_value.search.return_value = [1]
        (res, errors) = filter.process(props, 'test', ["test"])
        assert res is True
        assert len(errors) == 0

    @unittest.mock.patch.object(PluginRegistry, 'getInstance')
    def test_IsExistingDnOfType(self, mockedRegistry):
        # mockup ObjectIndex.search
        mockedRegistry.return_value.search.return_value = []

        # start the tests
        filter = IsExistingDnOfType()
        (res, errors) = filter.process(None, None, ["test"], "type")
        assert res == False
        assert len(errors) == 1

        mockedRegistry.return_value.search.return_value = [1]
        (res, errors) = filter.process(None, None, ["test"], "type")
        assert res == True
        assert len(errors) == 0

    @unittest.mock.patch.object(PluginRegistry, 'getInstance')
    def test_ObjectWithPropertyExists(self, mocked_registry):
        mocked_registry.return_value.search.return_value = []

        # start the tests
        filter = ObjectWithPropertyExists()
        (res, errors) = filter.process(None, None, ["test"], "type", "attr")
        assert res is False
        assert len(errors) == 1

        mocked_registry.return_value.search.return_value = [1]
        (res, errors) = filter.process(None, None, ["test"], "type", "attr")
        assert res is True
        assert len(errors) == 0
