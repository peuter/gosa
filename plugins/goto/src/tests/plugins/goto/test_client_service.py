# This file is part of the GOsa project.
#
#  http://gosa-project.org
#
# Copyright:
#  (C) 2016 GONICUS GmbH, Germany, http://www.gonicus.de
#
# See the LICENSE file in the project's top-level directory for details.
import pytest
from unittest import TestCase, mock
from gosa.plugins.goto.client_service import *


class MQTTHandlerMock(mock.MagicMock):
    callback = None

    def set_subscription_callback(self, cb):
        self.callback = cb

    def simulate_message(self, topic, message):
        self.callback(topic, message)


class GotoClientServiceTestCase(TestCase):

    def setUp(self):
        self.service = ClientService()
        # use the mocked handler instead of the real one
        self.service.mqtt = MQTTHandlerMock()
        self.service.serve()

    def __announce_client(self):
        e = EventMaker()
        netinfo = []
        more = []
        netinfo.append(
            e.NetworkDevice(
                e.Name("eth0"),
                e.IPAddress("127.0.0.1"),
                e.IPv6Address("::1/128"),
                e.MAC("00:00:00:00:01"),
                e.Netmask("255.255.255.0"),
                e.Broadcast("127.0.0.255")))
        more.append(e.NetworkInformation(*netinfo))

        info = e.Event(
            e.ClientAnnounce(
                e.Id("fake_client_uuid"),
                e.Name("Testclient"),
                *more))

        self.service.mqtt.simulate_message("net.example/client/fake_client_uuid", etree.tostring(info))

    def __announce_client_caps(self):
        e = EventMaker()
        # Assemble capabilities
        more = []
        caps = []
        caps.append(
            e.ClientMethod(
                e.Name("fakeCommand"),
                e.Path("path"),
                e.Signature("signature"),
                e.Documentation("This is a fake command for testing purpose")))
        more.append(e.ClientCapabilities(*caps))

        info = e.Event(
            e.ClientSignature(
                e.Id('fake_client_uuid'),
                e.Name('Testclient'),
                *more))
        self.service.mqtt.simulate_message("net.example/client/fake_client_uuid", etree.tostring(info))

    @mock.patch("gosa.plugins.goto.client_service.ClientService.systemSetStatus")
    @mock.patch("gosa.plugins.goto.client_service.ClientService.systemGetStatus", return_value="")
    def test_clients(self, mocked_get_status, mocked_set_status):
        assert self.service.getClients() == {}

        # announce fake client via MQTT
        self.__announce_client()

        clients = self.service.getClients()
        assert len(clients) == 1
        assert "fake_client_uuid" in clients
        assert clients["fake_client_uuid"]["name"] == "Testclient"

        net = self.service.getClientNetInfo('fake_client_uuid')
        assert "eth0" in net
        assert net["eth0"]['IPAddress'] == "127.0.0.1"

        assert self.service.getClientNetInfo('unknown_client_uuid') == []

        assert self.service.getClientMethods('unknown_client_uuid') == []
        assert self.service.getClientMethods('fake_client_uuid') == {}

        self.__announce_client_caps()
        methods = self.service.getClientMethods('fake_client_uuid')
        assert 'fakeCommand' in methods

        utcnow = datetime.datetime.utcnow() - datetime.timedelta(seconds=1500)
        e = EventMaker()
        # set client offline
        with mock.patch("gosa.plugins.goto.client_service.datetime.datetime") as m:
            m.utcnow.return_value = utcnow
            # send a client ping to store the faked current time
            ping = e.Event(e.ClientPing(e.Id('fake_client_uuid')))
            self.service.mqtt.simulate_message("net.example/client/fake_client_uuid", etree.tostring(ping))

        # run garbage collection
        self.service._ClientService__gc()
        assert self.service.getClientMethods('fake_client_uuid') == []

        # disconnect client
        offline = e.Event(e.ClientLeave(
            e.Id('fake_client_uuid')
        ))
        self.service.mqtt.simulate_message("net.example/client/fake_client_uuid", etree.tostring(offline))
        assert self.service.getClientMethods('fake_client_uuid') == []

    @mock.patch("gosa.plugins.goto.client_service.ClientService.systemSetStatus")
    @mock.patch("gosa.plugins.goto.client_service.ClientService.systemGetStatus", return_value="")
    def test_users(self, mocked_get_status, mocked_set_status):
        # setup users
        self.__announce_client()
        self.__announce_client_caps()

        # setup session
        e = EventMaker()
        info = e.Event(
            e.UserSession(
                e.Id('fake_client_uuid'),
                e.User(e.Name('tester'))))

        self.service.mqtt.simulate_message("net.example/client/fake_client_uuid", etree.tostring(info))

        assert self.service.getUserSessions()[0] == 'fake_client_uuid'

        assert self.service.getUserSessions("unknown_client_uuid") == []
        assert self.service.getUserSessions("fake_client_uuid")[0] == 'tester'

        assert self.service.getUserClients("tester") == ['fake_client_uuid']
        assert self.service.getUserClients("unknown_user") == []

        # notify user
        with mock.patch.object(self.service, "clientDispatch") as m:
            self.service.notifyUser('unknown_user', 'Title', 'Message')
            assert not m.called

            self.service.notifyUser('tester', 'Title', 'Message')
            m.assert_called_with('fake_client_uuid', 'notify', 'tester', 'Title', 'Message', 10, 'dialog-information')
            m.reset_mock()

            self.service.notifyUser('tester', 'Title', 'Message', icon=None)
            m.assert_called_with('fake_client_uuid', 'notify', 'tester', 'Title', 'Message', 10, '_no_icon_')

            m.reset_mock()
            m.side_effect = Exception("test")
            self.service.notifyUser('tester', 'Title', 'Message')
            m.side_effect = None

            with mock.patch("gosa.plugins.goto.client_service.JsonRpcHandler.user_sessions_available", return_value=True):
                self.service.notifyUser('tester', 'Title', 'Message')
                assert self.service.mqtt.send_event.called

            m.reset_mock()
            self.service.mqtt.send_event.reset_mock()

            # all users
            self.service.notifyUser(None, 'Title', 'Message')
            m.assert_called_with('fake_client_uuid', 'notify_all', 'Title', 'Message', 10, 'dialog-information')

            with mock.patch("gosa.plugins.goto.client_service.JsonRpcHandler.user_sessions_available", return_value=True):
                self.service.notifyUser(None, 'Title', 'Message')
                assert self.service.mqtt.send_event.called

            m.reset_mock()
            m.side_effect = Exception("test")
            self.service.notifyUser(None, 'Title', 'Message')

    @mock.patch("gosa.plugins.goto.client_service.LDAPHandler.get_instance")
    def test_systemGetStatus(self, mocked_ldap):
        mocked_ldap.return_value.get_handle.return_value.__enter__.return_value.search_s.return_value = []

        with pytest.raises(ValueError):
            self.service.systemGetStatus('some_uuid')

        mocked_ldap.return_value.get_handle.return_value.__enter__.return_value.search_s.return_value = [[0, {'deviceStatus': [b"O"]}]]

        assert self.service.systemGetStatus('some_uuid') == "O"

    @mock.patch("gosa.plugins.goto.client_service.LDAPHandler.get_instance")
    def test_systemSetStatus(self, mocked_ldap):
        mocked_conn = mocked_ldap.return_value.get_handle.return_value.__enter__.return_value
        mocked_conn.search_s.return_value = []

        with pytest.raises(ValueError):
            self.service.systemSetStatus('some_uuid', "+O")

        mocked_conn.search_s.return_value = [[0, {'deviceStatus': [b"O"]}]]
        self.service.systemSetStatus('some_uuid', "-O")
        mocked_conn.modify.assert_called_with(0, [(ldap.MOD_REPLACE, "deviceStatus", [b'[""]'])])

        with pytest.raises(ValueError):
            self.service.systemSetStatus('some_uuid', "+X")

        self.service.systemSetStatus('some_uuid', "+U")
        mocked_conn.modify.assert_called_with(0, [(ldap.MOD_REPLACE, "deviceStatus", [b'["OU"]'])])

        mocked_conn.search_s.return_value = [[0, {}]]
        self.service.systemSetStatus('some_uuid', "+U")
        mocked_conn.modify.assert_called_with(0, [(ldap.MOD_ADD, "deviceStatus", [b'["U"]'])])

    @mock.patch("gosa.plugins.goto.client_service.LDAPHandler.get_instance")
    def test_joinClient(self, mocked_ldap):

        with pytest.raises(ValueError):
            self.service.joinClient('tester', 'wrong_uuid', '00:00:00:00:00:01')

        with pytest.raises(GOtoException):
            self.service.joinClient('tester', 'fff0c8ad-d26b-4b6d-8e8e-75e054614dd9', '00:00:00:00:00:01')

    def test_listeners(self):
        callback1 = mock.MagicMock()
        callback2 = mock.MagicMock()
        self.service.register_listener('testMethod1', callback1)
        self.service.register_listener('testMethod2', callback2)

        self.service.unregister_listener('testMethod3', callback1)
        self.service.unregister_listener('testMethod2', callback1)
        self.service.unregister_listener('testMethod2', callback2)

        self.service.notify_listeners("id1", "testMethod1", "state1")
        self.service.notify_listeners("id2", "testMethod2", "state2")

        callback1.assert_called_with("id1", "testMethod1", "state1")
        assert not callback2.called