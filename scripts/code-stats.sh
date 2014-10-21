#!/bin/bash
cd ${1:-.}
wc $(find_regex ".*\.(${2:-js|html|less|lessimport})" cat|grep -v -E '(vendor|/tmp/|node_modules|\\.build|sinon)')
