
# Troubleshooting
  

Troubleshooting guide for issues with environment set up
  

## Issues with building PlayerUI

The following error may occur when running `bazel build //:PlayerUI` for users with M1 Macs:

Error loading Slather 
```
**ERROR:** An error occurred during the fetch of repository 'Pods':

Traceback (most recent call last):

File "/private/var/tmp/_bazel_zwu01/b883e4a46e2ad6f01dded1b0b227bcc1/external/rules_player/cocoapods/cocoapod.bzl", line 99, column 11, in _pod_install_impl

fail("Return: {code} {stderr}".format(code = install_result.return_code, stderr = install_result.stderr))

Error in fail: Return: 1

---------------------------------------------

Error loading the plugin `slather-2.5.0`.
```
  

  

to fix this:

`gem install slather`

  

If that is unsuccessful and you get

  
```
ERROR:  Error installing slather:

There are no versions of nokogiri (>= 1.14.3) compatible with your Ruby & RubyGems. Maybe try installing an older version of the gem you're looking for?

nokogiri requires Ruby version >= 2.7, < 3.3.dev. The current ruby version is 2.6.10.210.
```
  

try:
`gem install nokogiri --platform=ruby`

If you are still experience issues after this, you may need to run 
`bazel clean && bazel shutdown` as well as `bazel sync` before trying `bazel build //:PlayerUI` again
