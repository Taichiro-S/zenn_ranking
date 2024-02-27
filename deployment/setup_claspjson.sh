#!/bin/sh

CLASPJSON=$(cat <<-END
    {
        "scriptId": "$SCRIPT_ID",
        "rootDir": "/home/runner/work/dc_gas_gform2gsheet_clasp/dc_gas_gform2gsheet_clasp/dist",
        "fileExtension": ["js"]
    }
END
)

echo $CLASPJSON > ~/.clasp.json