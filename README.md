Chrome extension to use _any_ text editor for editable content on _any_** website

![kindred](../screenshot/screenshot.gif "kindred")


This is more of a personal project I made for my own use. If there is enough interest to support a certain feature I will add it if I have the time.

** The code is in place to support any editable element or web component. However it's impossible for me to go searching for every specialized web "component" or "app" on the web. Right now it has support for things that I need, such as simple input's and textarea's as well as sites that use CodeMirror.

If you want to add your own it's as simple as creating a _strategy_ that implements a detection function and a runner function as shown here: [action.js](https://github.com/hnry/kindred/blob/master/chrome/src/action.js#L3)

---

## Install

You need the Chrome extension which can be downloaded at the [Chrome Web Store](https://chrome.google.com/webstore/detail/kindred-edit/dpkkhfheimdlfnggohlldimgogndoedh).


After the extension is installed you also need the native component of the extension.

It is a binary, which can downloaded at [Releases](https://github.com/hnry/kindred/releases)

For OS X / Linux you can just run `install.sh` that is part of this repository.

For Windows it is a bit more involved. Which I won't go into detail here, but you can find more information at [https://developer.chrome.com/extensions/nativeMessaging#native-messaging-host](https://developer.chrome.com/extensions/nativeMessaging#native-messaging-host)

