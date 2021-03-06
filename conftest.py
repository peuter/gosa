import pytest
import sys
from gosa.common import Environment
import os

def pytest_addoption(parser):
    parser.addoption("--runslow", action="store_true",
                     help="run slow tests")


def pytest_configure(config):
    sys._called_from_test = True


def pytest_unconfigure(config):
    del sys._called_from_test

@pytest.fixture(scope="session", autouse=True)
def use_test_config():
    Environment.reset()
    Environment.config = os.path.join(os.path.dirname(os.path.realpath(__file__)), "test_conf")
    Environment.noargs = True

