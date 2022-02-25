# Contributing to SteamBadgeUnlocker

Thanks for your interest in making `SteamBadgeUnlocker` better! Please, read over this document quickly before you
submit your issue or pull request.

# Issues

Submitting an issue?

- If you're **reporting a bug**, please include all relevant details.
	- A descriptive title helps for one. Titles of just "Error" or "It doesn't work" really don't help.
	- Please describe what you're trying to do, what actually happens, and what you can do to reproduce the problem.
	- If you have an error message or a crash, please include the full text of the error message and the stack trace.
	- Include the relevant snippet of your code. Wrap it in \`\`\`js /* code */ \`\`\` and
	  GitHub [will format it nicely for you](https://help.github.com/articles/github-flavored-markdown/#syntax-highlighting)
	  .

# Pull Requests

Submitting a pull request? Great! Thanks for contributing your time and code! Please keep the following in mind.

- Please follow the existing code style.
	- Tabs for indentation
	- camelCase for variables and functions
	- Opening braces on the same line as the if/for/while statement
	- No omitting unnecessary braces
	- etc.
- Please avoid breaking changes. If you make a breaking change that can be done in a backwards-compatible manner, I
  won't accept it.
- Please don't increment the version number in `package.json`. I'll do that myself when I publish it to npm.
- Please include a brief description of your change in the pull request if it's not immediately apparent from the code.
- Be understanding if I don't think that your change falls within the scope of this module.
