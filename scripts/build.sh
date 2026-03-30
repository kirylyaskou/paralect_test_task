#!/bin/bash
# Workaround for Next.js 16 prerender bugs on internal pages
# LayoutRouterContext is null during static generation for _global-error, _not-found, etc.
next build 2>&1 | tee /tmp/next-build.log
EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -ne 0 ]; then
  # Only allow known internal prerender bugs to pass
  if grep -q "Export encountered an error on /\_" /tmp/next-build.log && \
     grep -q "useContext" /tmp/next-build.log; then
    echo ""
    echo "Warning: Ignoring known Next.js 16 internal prerender bug"
    exit 0
  fi
  exit $EXIT_CODE
fi
