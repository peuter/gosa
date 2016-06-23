# This file is part of the GOsa framework.
#
#  http://gosa-project.org
#
# Copyright:
#  (C) 2016 GONICUS GmbH, Germany, http://www.gonicus.de
#
# See the LICENSE file in the project's top-level directory for details.

import traceback
import gettext
import uuid
from datetime import datetime
from pkg_resources import resource_filename #@UnresolvedImport
from gosa.common.utils import N_
from gosa.common import Environment
from gosa.common.components import Command
from gosa.common.components import Plugin


class GosaErrorHandler(Plugin):
    #TODO: maintain the owner (or originator) of the error message, to
    #      allow only the originator to pull her/his error messages.
    _target_ = "core"
    _codes = {}
    _i18n_map = {}
    _errors = {}

    @Command(needsUser=True, __help__=N_("Get the error message assigned to a specific ID."))
    def getError(self, user, _id, locale=None, trace=False):
        res = None

        if _id in self._errors:
            if trace:
                res = self._errors[_id]
            else:
                res = self._errors[_id]
                del res['trace']

        # Translate message if requested
        if res and locale:
            mod = GosaErrorHandler._i18n_map[res['code']]
            t = gettext.translation('messages',
                resource_filename(mod, "locale"),
                fallback=True,
                languages=[locale])

            res['text'] = t.gettext(GosaErrorHandler._codes[res['code']])

            # Process details by translating detail text
            if res['details']:
                for detail in res['details']:
                    detail['detail'] = t.gettext(detail['detail']) % detail

        # Fill keywords
        res['text'] = res['text'] % res['kwargs']
        res['_id'] = _id

        # Remove the entry
        del self._errors[_id]

        return res

    @staticmethod
    def make_error(code, topic=None, details=None, **kwargs):

        # Add topic to make it usable inside of the error messages
        if not kwargs:
            kwargs = {}
        kwargs.update(dict(topic=topic))

        # Assemble message
        text = GosaErrorHandler._codes[code] % kwargs

        # Assemble error information
        data = dict(code=code, topic=topic, text=text,
                kwargs=kwargs, trace=traceback.format_stack(),
                details=details,
                timestamp=datetime.now(), user=None)

        # Save entry
        __id = uuid.uuid1()
        GosaErrorHandler._errors[__id] = data

        # First, catch unconverted exceptions
        if not code in GosaErrorHandler._codes:
            return code

        return '<%s> %s' % (__id, text)

    @staticmethod
    def register_codes(codes, module="gosa.plugin"):
        GosaErrorHandler._codes.update(codes)

        # Memorize which module to get translations from
        for k in codes.keys():
            GosaErrorHandler._i18n_map[k] = module


class GosaException(Exception):
    """
    Gosa base exception that converts the error to a string and
    feeds it to the database  in parallel. Errors emitted with
    GosaException can be queried by their ID later on.
    """

    def __init__(self, *args, **kwargs):
        info = GosaErrorHandler.make_error(*args, **kwargs)
        super(GosaException, self).__init__(info)


# Register basic errors
GosaErrorHandler.register_codes(dict(
    NOT_IMPLEMENTED=N_("Method %(method)s is not implemented"),
    NO_SUCH_RESOURCE=N_("Cannot read resource '%(resource)s'"),
    ))