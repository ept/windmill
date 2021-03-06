# Generated by the windmill services transformer
import functest
from windmill.authoring import WindmillTestClient

def test_recordingSuite0():
    client = WindmillTestClient(__name__, assertions=False)

    assert client.open(url=u'http://tutorial.getwindmill.com/windmill-unittests/unit_tester.html')['result']
    assert client.waits.forPageLoad(timeout=u'8000')['result']
    assert client.click(value=u'lookupByValue')['result']
    assert client.click(classname=u'lookupByClassname')['result']
    assert client.click(name=u'lookupByName')['result']
    assert client.click(id=u'lookupById')['result']
    assert client.click(jsid=u'jsNode()')['result']
    assert client.click(tagname=u'hr')['result']