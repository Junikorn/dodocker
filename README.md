# DoDocker

CLI tool helper for fast image building with tags based on git revision.
If you wish to push to private repository you need to run ```docker login <REPOSITORY>``` before using DoDocker.
For available options please run ```dodocker --help```.

If you not wish to provide repository and image name for every run please create .dodocker file based on example below.
```javascript
module.exports = {
  repository: '', // repository name
  scope: '',      // image scope inside repository (optional)
  name: '',       // image name
  tag: {          // optional (default below)
    predicate: tag => /^([\w\d.]+)$/i.test(tag),  // method checking if tag is ok to use as docker image tag
    format: tag => tag                            // method formatting tag to desired format
  },
  branch: {       // optional (default below)
    predicate: branch => /^([\w\d.\/]+)$/i.test(branch),  // method checking if branch name is ok to use as docker image tag
    format: branch => branch.replace('/', '_')            // method formatting branch name to desired format
  },
  arguments: revision => [] // method feeding build args to image build based on git revision (optional)
};
```

## Changelog

Changelog is available [here](./CHANGELOG.md).

## License

The MIT License (MIT)

> Copyright (c) 2019 Błażej Wolańczyk
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
