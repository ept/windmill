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

import windmill
import os, sys, logging
import functest

class LogLevel(object):
    """Log level command, sets the global logging level."""
    option_names = (None, 'loglevel')
    def __call__(self, value):
        level = getattr(logging, value)
        windmill.settings['CONSOLE_LOG_LEVEL'] = getattr(logging, value)
        return level
        
class ExitOnDone(object):
    """Exit after all tests have run."""
    option_names = ('e', 'exit')
    def __call__(self):
        windmill.settings['EXIT_ON_DONE'] = True
    
class Debug(object):    
    """Turn on debugging."""    
    option_names = ('d', 'debug')
    def __call__(self):
        windmill.settings['CONSOLE_LOG_LEVEL'] = getattr(logging, 'DEBUG')
    
# class TestFile(object):
#     """Set the test file to run on startup."""
#     option_names = (None, 'testfile')
#     
#     def __call__(self, value):
#         windmill.settings['TEST_FILE'] = os.path.abspath(os.path.expanduser(value))
#     
# class TestDir(object):
#     """Set the test directory to run on startup."""
#     option_names = (None, 'testdir')
#     
#     def __call__(self, value):
#         windmill.settings['TEST_DIR'] = os.path.abspath(os.path.expanduser(value))

class RunTest(object):
    """Run the given test file/dir"""
    option_names = ('t', 'test')
    def __call__(self, value):
        windmill.settings['RUN_TEST'] = os.path.abspath(os.path.expanduser(value))
        
class LoadTest(object):
    """Run the given test file/dir"""
    option_names = ('l', 'loadtest')
    def __call__(self, value):
        windmill.settings['LOAD_TEST'] = os.path.abspath(os.path.expanduser(value))    
        
class GeneralBoolSettingToTrue(object):
    """Base class for setting a generic value to True."""
    def __call__(self):
        windmill.settings[self.setting] = True
        
class GeneralBoolSettingToFalse(object):
    """Base class for setting a generic value to False."""
    def __call__(self):
        windmill.settings[self.setting] = False
        
class StartFirefox(GeneralBoolSettingToTrue):
    """Start the firefox browser."""
    option_names = ('m', 'firefox')
    setting = 'START_FIREFOX'
    
class StartIE(GeneralBoolSettingToTrue):
    """Start the internet explorer browser. Windows Only."""
    option_names = ('x', 'ie')
    setting = 'START_IE'
    
class StartSafari(GeneralBoolSettingToTrue):
    """Start the Safari browser. Mac Only."""
    option_names = ('s', 'safari')
    setting = 'START_SAFARI'
    
# class RunPythonTests(object):
#     """Run a set of python tests. 
#         If no test file is specified the current directory is used."""
#     option_names = ('t', 'tests')
#     setting = 'PYTHON_TEST_FRAME'
#     def __call__(self, value=None):
#         windmill.settings[self.setting] = True
#         windmill.settings['PYTHON_TEST_FILE'] = value

class JavascriptTestDir(object):
    """JavaScript Test Framework : 
        Root directory of JavaScript tests."""
    option_names = (None, 'jsdir')
    setting = 'JAVASCRIPT_TEST_DIR'
    def __call__(self, value):
        windmill.settings[self.setting] = value
        
class JavascriptTestFilter(object):
    """JavaScript Test Framework : 
        Filter tests, example; ns:test_login,tests:test_user."""
    option_names = (None, 'jsfilter')
    setting = 'JAVASCRIPT_TEST_FILTER'
    def __call__(self, value):
        windmill.settings[self.setting] = value
        
class JavascriptTestRunOnly(object):
    """JavaScript Test Framework : 
        Specify the phases the framework should run example; setup,test,teardown"""
    option_names = (None, 'jsphase')
    setting = 'JAVASCRIPT_TEST_PHASE'
    def __call__(self, value):
        windmill.settings[self.setting] = value

class Extensions(object):
    """The directory containing any windmill javascript extensions."""
    option_names = (None, 'extensions')
    setting = 'EXTENSIONS_DIR'
    def __call__(self, value):
        windmill.settings[self.setting] = value

class PDB(GeneralBoolSettingToTrue):
    """Enable pdb debugging when running python tests."""
    option_names = ('p', 'pdb')
    setting = 'ENABLE_PDB'
    
class BrowserDebugging(GeneralBoolSettingToTrue):
    """Enable browser debugging. 
        Python tests will all load in to the server at once."""
    option_names = (None, 'browserdebug')
    setting = 'BROWSER_DEBUGGING'
    
class ContinueOnFailure(GeneralBoolSettingToTrue):
    """Keep the browser running tests after failure."""
    option_names = ('c', 'continueonfailure')
    setting = 'CONTINUE_ON_FAILURE'
    
class UseCode(GeneralBoolSettingToTrue):
    """Use the code module rather than ipython."""
    option_names = (None, 'usecode')
    setting = 'USECODE'
        
def process_module(module):
    """Process this modules option list"""
    options_dict = {}
    flags_dict = {}
    
    for klass in [getattr(module, cname) for cname in dir(module) if hasattr(getattr(module, cname), 'option_names')]:
        if klass.option_names[0] is not None:
            flags_dict[klass.option_names[0]] = klass()
        options_dict[klass.option_names[1]] = klass()
        
    module.options_dict = options_dict
    module.flags_dict = flags_dict
    
def help(bin_name='windmill'):
    """Print windmill command line help."""
    bin_name = 'windmill'
    module = sys.modules[__name__]
    from windmill.conf import global_settings
    all_option_names = []
    options_string = []
    for option in [getattr(module, x) for x in dir(module) if (
                   hasattr(getattr(module, x), 'option_names')) and (
                   getattr(module, x).__doc__ is not None ) ]:
        all_option_names.append(option.option_names)
        if hasattr(option, 'setting'):
            if getattr(global_settings, option.setting, None) is not None:
                default = ' Defaults to %s' % str(getattr(global_settings, option.setting, None))
            else:
                default = ''
        else:
            default = ''
        if option.option_names[0] is None:
            options_string.append('    '+'  '.join(['('+str(option.option_names[1]+'='+')'), 
                                  option.__doc__]) + default)
        else:
            options_string.append('    '+'  '.join([
                                  str('('+option.option_names[0])+', '
                                  +str(option.option_names[1])+'='+')',
                                  option.__doc__]) + default)

    preamble = """windmill web test automation system.
    %s [-%s] action [option=value] [firefox|ie|safari] [http://www.example.com]
    
Available Actions:
    shell         Enter the windmilll shell environment (modified python shell). 
                  Uses ipython if installed. Exit using ^d
    run_service   Run the windmill service in foreground. Kill using ^c.
    wx            Run the wxPython based graphical interface for the 
                  windmill service. Still experimental.
    
Available Options:""" % ( bin_name,
                         ''.join([ o[0] for o in all_option_names if o[0] is not None ]) 
                        )
    print preamble
    print '\n'.join(options_string)
    



