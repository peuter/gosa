#!/usr/bin/env python
# This file is part of the GOsa project.
#
#  http://gosa-project.org
#
# Copyright:
#  (C) 2016 GONICUS GmbH, Germany, http://www.gonicus.de
#
# See the LICENSE file in the project's top-level directory for details.

from setuptools import setup, find_packages
import os
import platform

try:
    from babel.messages import frontend as babel
except:
    pass

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.md')).read()
CHANGES = open(os.path.join(here, 'CHANGES')).read()

data_files = []
for path, dirs, files in os.walk("src/gosa/backend/data"):
    for f in files:
            data_files.append(os.path.join(path[17:], f))


setup(
    name = "gosa.backend",
    version = "1.0",
    author = "GONICUS GmbH",
    author_email = "info@gonicus.de",
    description = "Identity-, system- and configmanagement middleware",
    long_description = README + "\n\n" + CHANGES,
    keywords = "system config management ldap groupware",
    license = "GPL",
    url = "http://gosa-project.org",
    classifiers = [
        'Development Status :: 4 - Beta',
        'Environment :: Console',
        'Intended Audience :: System Administrators',
        'License :: OSI Approved :: GNU General Public License (GPL)',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: System :: Systems Administration',
        'Topic :: System :: Systems Administration :: Authentication/Directory',
        'Topic :: System :: Software Distribution',
        'Topic :: System :: Monitoring',
    ],

    packages = find_packages('src', exclude=['examples', 'tests']),
    package_dir={'': 'src'},
    namespace_packages = ['gosa'],

    include_package_data = True,
    package_data = {
        'gosa.backend': data_files
    },

    zip_safe = False,

    setup_requires = [
        'pytest-runner',
        'pylint',
        ],
    tests_require = [
        'pytest',
        'pytest-cov',
        'python-coveralls'
    ],
    install_requires = [
        'tornado',
        'zope.interface>=3.5',
        'zope.event',
        'unidecode',
        'pyldap'
        ],

    entry_points = """
        [console_scripts]
        gosa = gosa.backend.main:main

        [gosa.route]
        /events = gosa.backend.routes.sse.main:SseHandler
        /sse_test = gosa.backend.routes.sse.main:SseClient
        /rpc = gosa.backend.components.jsonrpc_service:JsonRpcHandler

        [gosa.plugin]
        scheduler = gosa.backend.components.scheduler:SchedulerService
        #xxxxxxx acl = gosa.backend.acl:ACLResolver
        objects = gosa.backend.objects.index:ObjectIndex
        httpd = gosa.backend.components.httpd:HTTPService
        command = gosa.backend.command:CommandRegistry
        #xxxxxxx jsonrpc_om = gosa.backend.components.jsonrpc_objects:JSONRPCObjectMapper
        #xxxxxxx guimethods = clacks.agent.plugins.gosa.methods:GuiMethods
        #xxxxxxx sambaguimethods = clacks.agent.plugins.samba.domain:SambaGuiMethods
        transliterate = gosa.backend.plugins.misc.transliterate:Transliterate
        locales = gosa.backend.plugins.misc.locales:Locales
        gravatar = gosa.backend.plugins.misc.gravatar:Gravatar
        shells = gosa.backend.plugins.posix.shells:ShellSupport
        #xxxxxxx password = gosa.backend.plugins.password.manager:PasswordManager

        [gosa.object.backend]
        ldap = gosa.backend.objects.backend.back_ldap:LDAP
        null = gosa.backend.objects.backend.back_null:NULL
        json = gosa.backend.objects.backend.back_json:JSON

        [gosa.object.type]
        string = gosa.backend.objects.types.base:StringAttribute
        anytype = gosa.backend.objects.types.base:AnyType
        integer = gosa.backend.objects.types.base:IntegerAttribute
        boolean = gosa.backend.objects.types.base:BooleanAttribute
        binary = gosa.backend.objects.types.base:BinaryAttribute
        unicodestring = gosa.backend.objects.types.base:UnicodeStringAttribute
        date = gosa.backend.objects.types.base:DateAttribute
        timestamp = gosa.backend.objects.types.base:TimestampAttribute
        sambalogonhours = gosa.backend.plugins.samba.logonhours:SambaLogonHoursAttribute
        aclrole = gosa.backend.objects.types.acl_roles:AclRole
        aclset = gosa.backend.objects.types.acl_set:AclSet

        [gosa.object.filter]
        concatstring = gosa.backend.objects.filter.strings:ConcatString
        joinarray = gosa.backend.objects.filter.strings:JoinArray
        splitstring = gosa.backend.objects.filter.strings:SplitString
        replace = gosa.backend.objects.filter.strings:Replace
        stringToTime = gosa.backend.objects.filter.strings:StringToTime
        stringToDate = gosa.backend.objects.filter.strings:StringToDate
        dateToString = gosa.backend.objects.filter.strings:DateToString
        timeToString = gosa.backend.objects.filter.strings:TimeToString
        target = gosa.backend.objects.filter.basic:Target
        setbackends = gosa.backend.objects.filter.basic:SetBackends
        setvalue = gosa.backend.objects.filter.basic:SetValue
        clear = gosa.backend.objects.filter.basic:Clear
        integertodatetime = gosa.backend.objects.filter.basic:IntegerToDatetime
        datetimetointeger = gosa.backend.objects.filter.basic:DatetimeToInteger
        stringtodatetime = gosa.backend.objects.filter.basic:StringToDatetime
        datetimetostring = gosa.backend.objects.filter.basic:DatetimeToString
        sambahash = gosa.backend.plugins.samba.hash:SambaHash
        adddollar = gosa.backend.plugins.samba.dollar:SambaDollarFilterIn
        deldollar = gosa.backend.plugins.samba.dollar:SambaDollarFilterOut
        sambaacctflagsin = gosa.backend.plugins.samba.flags:SambaAcctFlagsIn
        sambaacctflagsout = gosa.backend.plugins.samba.flags:SambaAcctFlagsOut
        sambamungedialin = gosa.backend.plugins.samba.munged:SambaMungedDialIn
        sambamungedialout = gosa.backend.plugins.samba.munged:SambaMungedDialOut
        detectsambadomainnamefromsid = gosa.backend.plugins.samba.sid:DetectSambaDomainFromSID
        generatesambasid = gosa.backend.plugins.samba.sid:GenerateSambaSid
        posixgetnextid = gosa.backend.plugins.posix.filters:GetNextID
        generategecos = gosa.backend.plugins.posix.filters:GenerateGecos
        loadgecosstate = gosa.backend.plugins.posix.filters:LoadGecosState
        #xxxxx imagefilter = clacks.agent.plugins.user.filters:ImageProcessor
        generatedn = clacks.agent.plugins.user.filters:GenerateDisplayName
        loaddnstate = clacks.agent.plugins.user.filters:LoadDisplayNameState
        generateids = gosa.backend.plugins.posix.filters:GenerateIDs
        datetoshadowdays = gosa.backend.plugins.posix.shadow:DatetimeToShadowDays
        shadowdaystodate = gosa.backend.plugins.posix.shadow:ShadowDaysToDatetime
        detect_pwd_method = gosa.backend.plugins.password.filter.detect_method:DetectPasswordMethod
        password_lock = gosa.backend.plugins.password.filter.detect_locking:DetectAccountLockStatus
        addbackend = gosa.backend.objects.filter.basic:AddBackend

        [gosa.object.comparator]
        like = gosa.backend.objects.comparator.strings:Like
        regex = gosa.backend.objects.comparator.strings:RegEx
        stringlength = gosa.backend.objects.comparator.strings:stringLength
        equals = gosa.backend.objects.comparator.basic:Equals
        greater = gosa.backend.objects.comparator.basic:Greater
        smaller = gosa.backend.objects.comparator.basic:Smaller
        isvalidhostname = gosa.backend.plugins.misc.filter_validators:IsValidHostName
        isexistingdn = gosa.backend.plugins.misc.filter_validators:IsExistingDN
        objectwithpropertyexists = gosa.backend.plugins.misc.filter_validators:ObjectWithPropertyExists
        isexistingdnoftype = gosa.backend.plugins.misc.filter_validators:IsExistingDnOfType
        is_acl_role = gosa.backend.objects.comparator.acl_roles:IsAclRole
        is_acl_set = gosa.backend.objects.comparator.acl_set:IsAclSet
        isvalidsambadomainname = gosa.backend.plugins.samba.domain:IsValidSambaDomainName
        checksambasidlist = gosa.backend.plugins.samba.sid:CheckSambaSIDList

        [gosa.object.operator]
        and = gosa.backend.objects.operator.bool:And
        or = gosa.backend.objects.operator.bool:Or
        not = gosa.backend.objects.operator.bool:Not

        [gosa.object.renderer]
        extensions = gosa.backend.objects.renderer.extensions:ExtensionRenderer

        [password.methods]
        crypt_method = gosa.backend.plugins.password.crypt_password:PasswordMethodCrypt
    """,
)