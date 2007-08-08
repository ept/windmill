 function getXPath(node, path) {
    path = path || [];
    if(node.parentNode) {
      path = getXPath(node.parentNode, path);
    }

    if(node.previousSibling) {
      var count = 1;
      var sibling = node.previousSibling
      do {
        if(sibling.nodeType == 1 && sibling.nodeName == node.nodeName) {count++;}
        sibling = sibling.previousSibling;
      } while(sibling);
      if(count == 1) {count = null;}
    } else if(node.nextSibling) {
      var sibling = node.nextSibling;
      do {
        if(sibling.nodeType == 1 && sibling.nodeName == node.nodeName) {
          var count = 1;
          sibling = null;
        } else {
          var count = null;
          sibling = sibling.previousSibling;
        }
      } while(sibling);
    }

    if(node.nodeType == 1) {
      path.push(node.nodeName.toLowerCase() + (node.id ? "[@id='"+node.id+"']" : count > 0 ? "["+count+"]" : ''));
    }
    return path;
  };
