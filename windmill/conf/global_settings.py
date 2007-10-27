#   Copyright (c) 2006-2007 Open Source Applications Foundation
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

import logging, os, sys, tempfile, shutil

def findInPath(fileName, path=os.environ['PATH']):
    dirs = path.split(os.pathsep)
    for dir in dirs:
        if os.path.isfile(os.path.join(dir, fileName)):
            return os.path.join(dir, fileName)
        if os.name == 'nt' or sys.platform == 'cygwin':
            if os.path.isfile(os.path.join(dir, fileName + ".exe")):
                return os.path.join(dir, fileName + ".exe")
    return None


CONSOLE_LOG_LEVEL = logging.INFO
FILE_LOG_LEVEL    = logging.INFO

SERVER_HTTP_PORT = 4444
PLATFORM         = sys.platform
WINDMILL_PATH    = os.path.dirname(os.path.abspath(os.path.dirname(__file__)))
JS_PATH          = os.path.join(WINDMILL_PATH, 'html')
SAVES_PATH       = None

TEST_URL  = 'http://windmill.osafoundation.org/tutorial'
TEST_FILE = None
TEST_DIR  = None
FORWARDING_TEST_URL = None

USECODE             = False
EXIT_ON_DONE        = False
CONTINUE_ON_FAILURE = False
ENABLE_PDB          = False
BROWSER_DEBUGGING   = False
START_FIREFOX       = False

PYTHON_TEST_FRAME = False
PYTHON_TEST_FILE  = None

JAVASCRIPT_TEST_DIR = None

# Browser prefs
MOZILLA_COMMAND = None
SAFARI_BINARY   = None
SAFARI_COMMAND  = None

# Mozilla prefs
MOZILLA_CREATE_NEW_PROFILE     = True

MOZILLA_PROFILE_PATH = tempfile.mkdtemp(suffix='.windmill')

if PLATFORM == 'darwin':
    firefoxApp = os.path.join('Applications', 'Firefox.app')
    firefoxDir = os.path.join(os.path.expanduser('~/'), firefoxApp)

    if not os.path.isdir(firefoxDir):
        firefoxDir = os.path.join('/', firefoxApp)

    MOZILLA_DEFAULT_PROFILE = os.path.join(firefoxDir, 'Contents', 'MacOS', 'defaults', 'profile')
    MOZILLA_BINARY          = os.path.join(firefoxDir, 'Contents', 'MacOS', 'firefox-bin')
    SAFARI_BINARY           = '/Applications/Safari.app/Contents/MacOS/Safari'
    SAFARI_COMMAND          = ['open', '-a', SAFARI_BINARY, TEST_URL+'/windmill-serv/start.html']
    NETWORKSETUP_BINARY = '/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Support/networksetup'

elif sys.platform == 'linux2':
    firefoxBin = findInPath('firefox')

    if firefoxBin is not None and os.path.isfile(firefoxBin):
        MOZILLA_BINARY = firefoxBin

    if os.path.isdir('/usr/share/firefox/defaults/profile'):
        MOZILLA_DEFAULT_PROFILE = '/usr/share/firefox/defaults/profile'
    if os.path.isdir('/usr/lib/mozilla-firefox/defaults/profile'):
        MOZILLA_DEFAULT_PROFILE = '/usr/lib/mozilla-firefox/defaults/profile'
    

elif os.name == 'nt' or sys.platform == 'cygwin':
    IE_BINARY  = findInPath('iexplore')
    firefoxBin = findInPath('firefox')

    if firefoxBin is None:
        try:
            firefoxBin = os.path.join(os.environ['ProgramFiles'], 'Mozilla Firefox', 'firefox.exe')
        except:
            firefoxBin = None

    if firefoxBin is not None and os.path.isfile(firefoxBin):
        firefoxDir = os.path.dirname(firefoxBin)

        MOZILLA_BINARY          = firefoxBin
        MOZILLA_DEFAULT_PROFILE = os.path.join(firefoxDir, 'defaults', 'profile')


if __name__ == '__main__':
    if '--test' in sys.argv:
        print 'running on           ', PLATFORM
        print 'we are at            ', WINDMILL_PATH
        print 'our JS is at         ', JS_PATH
        print 'firefox is at        ', MOZILLA_BINARY
        print 'default profile is at', MOZILLA_DEFAULT_PROFILE

