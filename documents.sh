#!/bin/bash
# helps replace the PDF viewer with a local pdf-js instance

for FILE in content/documents/*.md; do
    pdf_file="$(basename "${FILE%%.*}")"
    printf "\n\n{{< embed-pdf url="https://florencekelley.northwestern.edu/pdfs/$pdf_file.pdf" >}}" >> $FILE
done;