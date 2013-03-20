#!/bin/bash

################################################################################

REALPATH=`realpath "$0"`
cd `dirname "$REALPATH"`

################################################################################

APP_NAME="mongit"

APP_JS="./mongit-server.js"

APP_CMD="node $APP_JS"



################################################################################

case "$1" in
  "-prod") export PEO_MODE="production";  shift ;;
  "-test") export PEO_MODE="testing";     shift ;;
  "-dev")  export PEO_MODE="development"; shift ;;
esac

/etc/peo/appctrl-util.sh "$0" "$APP_NAME" "$APP_CMD" "$@"

################################################################################
