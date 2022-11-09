#! /bin/bash

# while getopts ":p:s:h" opt
# do
#    case "$opt" in
#       p) echo "p-$OPTARG" ;;
#       s) echo "s-$OPTARG" ;;
#       h) echo "h-$OPTARG" ;;
#       ?) echo "hello4" ;;
#    esac
# done

while [ $# -ne 0 ]; do
    case "$1" in
        -d)
             echo "d-$2"
             shift; shift
             ;;
        -s)
             echo "s-$2"
             shift; shift
             ;;
        -*)
             echo "Unknown option: $1" >&2
             exit 2
             ;;
        *)
             break
             ;;
    esac
done