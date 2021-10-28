#!/bin/bash

# helps replace the PDF viewer with a local pdf-js instance

add_shortcode() {
    for FILE in content/documents/*.md; do
        pdf_file="$(basename "${FILE%%.*}")"
        printf "\n\n{{< embed-pdf url="https://florencekelley.northwestern.edu/pdfs/$pdf_file.pdf" >}}#" >> $FILE
    done;
}

remove_iframe() {
    for FILE in content/documents/*.md; do
        sed -i '/iframe/d' $FILE
    done;
}