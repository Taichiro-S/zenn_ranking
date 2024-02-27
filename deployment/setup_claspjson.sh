#!/bin/sh

CLASPJSON=$(cat <<-END
    {
        "scriptId": "$SCRIPT_ID",
        "rootDir": "/home/runner/work/zenn_ranking/zenn_ranking/dist",
        "fileExtension": ["js"]
    }
END
)

echo $CLASPJSON > ~/.clasp.json