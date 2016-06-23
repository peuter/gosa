# This file is part of the GOsa framework.
#
#  http://gosa-project.org
#
# Copyright:
#  (C) 2016 GONICUS GmbH, Germany, http://www.gonicus.de
#
# See the LICENSE file in the project's top-level directory for details.

import unittest
import pytest
from gosa.backend.plugins.samba.sid import *

class SambaSidTestCase(unittest.TestCase):

    def test_CheckSambaSIDList(self):
        comp = CheckSambaSIDList(None)
        testDict = {
            "sambaSID": {
                "value": ["test"]
            }
        }
        (res, errors) = comp.process(testDict, "sambaSID", "test")
        assert res == False
        assert len(errors) == 1

        (res, errors) = comp.process(testDict, "sambaSID", "123")
        assert res == True
        assert len(errors) == 0

    @unittest.mock.patch.object(PluginRegistry, 'getInstance')
    def test_DetectSambaDomainFromSID(self, mockedRegistry):
        # mock the whole lookup in the ObjectIndex to return True
        MyObject = type('MyObject', (object,), {})
        index = MyObject()

        def search(param1, param2):
            res = {
                "sambaSID": ["sid"],
                "sambaDomainName": ["domain"]
            }
            return [res]

        index.search = search
        mockedRegistry.return_value = index

        filter = DetectSambaDomainFromSID(None)

        testDict = {
            "attr": {
                "value": []
            }
        }

        (key, valDict) = filter.process(None, "attr", testDict, "123")
        assert valDict["attr"]["value"] == []

        (key, valDict) = filter.process(None, "attr", testDict, "sid-123")
        assert valDict["attr"]["value"][0] == "domain"

    @unittest.mock.patch.object(PluginRegistry, 'getInstance')
    def test_GenerateSambaSid(self, mockedRegistry):
        # mock the whole lookup in the ObjectIndex to return True
        MyObject = type('MyObject', (object,), {})
        index = MyObject()

        def search(param1, param2):
            mock = unittest.mock.MagicMock(autoSpec=True, create=True)
            mock.count.return_value = 0
            return mock

        index.search = search
        mockedRegistry.return_value = index

        filter = GenerateSambaSid(None)

        with pytest.raises(SambaException):
            filter.process(None, None, None, None, None, "None")

        with pytest.raises(SambaException):
            filter.process(None, None, None, None, "None", "domain")

        testDict = {
            "sid": {
                "value": []
            }
        }
        # nothing found in index
        with pytest.raises(SambaException):
            filter.process(None, "sid", testDict, "user", "1", "domain")

        def search(param1, param2):
            mock = unittest.mock.MagicMock()
            mock.count.return_value = 1
            mock.__getitem__.return_value = {
                "sambaAlgorithmicRidBase": [1],
                "sambaSID": ["sid"]
            }
            return mock

        index.search = search

        with pytest.raises(SambaException):
            filter.process(None, None, None, "unknown", "1", "domain")

        # and now the tests with correct parameters
        (key, valDict) = filter.process(None, "sid", testDict, "user", "1", "domain")
        assert valDict["sid"]["value"][0] == "sid-3"

        (key, valDict) = filter.process(None, "sid", testDict, "group", "1", "domain")
        assert valDict["sid"]["value"][0] == "sid-4"

        (key, valDict) = filter.process(None, "sid", testDict, "group", "1", "domain", 1)
        assert valDict["sid"]["value"][0] == "sid-1"

        def search(param1, param2):
            mock = unittest.mock.MagicMock()
            mock.count.return_value = 1
            mock.__getitem__.return_value = {
                "sambaSID": ["sid"]
            }
            return mock

        index.search = search
        (key, valDict) = filter.process(None, "sid", testDict, "group", "1", "domain")
        assert valDict["sid"]["value"][0] == "sid-1003"