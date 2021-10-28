#!/bin/bash
# helps replace the PDF viewer with a local pdf-js instance

for FILE in content/documents/*.md; do
    pdf_file="$(basename "${FILE%%.*}")"
    echo "\n\n{{< embed-pdf url="./documents/$pdf_file.pdf" >}}" >> $FILE
done;