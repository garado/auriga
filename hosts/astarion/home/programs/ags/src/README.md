
# Auriga

Dream desktop config built in Typescript + SASS with Aylur's ags v2. Shoutout Aylur.

(TS/SASS code quality may be suspect, but I try. I'm not into web dev.)


```
.
├── assets
│   ├── defaults    # theme stuff (walls, etc)
│   ├── icons       # https://phosphoricons.com/
│   └── sourceview  # gtk source view themes
├── src
│   ├── globals.ts  # random global stuff
│   ├── scripts/    # misc scripts used by this config
│   ├── services/   # stuff for interfacing with external programs
│   ├── styles/     # SASS
│   ├── utils/      # random utility functions
│   └── views/      # all window definitions and components
├── app-lock.ts     # gtk3 lockscreen entrypoint
├── app.ts          # gtk4 regular desktop shell entrypoint
└── userconfig.ts   # auriga will use default if this is not provided
```
