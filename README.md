# DoDocker

CLI tool helper for fast image building with tags based on git revision.
If you wish to push to repository you need to run ```docker login <REPOSITORY>``` before using DoDocker.

## Available CLI options

```
  -V, --version                          output the version number
  -c, --config                           Path to config file (if different than .dodocker)
  -p, --push                             Push image to repository
  -l, --latest                           Push as latest
  -r, --repository [repository]          Docker repository
  -s, --scope [scope]                    Docker image scope
  -n, --image-name [image-name]          Docker image name
  -R, --run                              Run Docker image in container (detached mode)
  -P, --port [port]                      Expose container port
  -N, --container-name [container-name]  Container name
  -h, --help                             output usage information
```

If you do not wish to provide repository and image name for every run please create ```.dodocker``` file based on example below.
Values provided in this file will be used as defaults, but can be overwritten by CLI options.
```javascript
module.exports = {
  // image props
  repository: '', // repository name
  scope: '',      // image scope inside repository
  name: '',       // image name
  // container props
  container: '',  // container name
  port: '',       // container expose port
  // git tag -> docker tag logic
  tag: {          // default below
    predicate: tag => tag && /^([\w\d.+\-]+)$/i.test(tag),            // method checking if tag is ok to use as docker image tag
    format: tag => tag.replace('+', '_')                              // method formatting tag to desired format
  },
  branch: {       // default below
    predicate: branch => branch && /^([\w\d.\/\-]+)$/i.test(branch),  // method checking if branch name is ok to use as docker image tag
    format: branch => branch.replace('/', '_')                        // method formatting branch name to desired format
  },
  // build-arg passing
  arguments: ({ tag, branch, commit }) => []  // method feeding build args to image build based on git revision (optional, should return String[])
};
```

## Example usage:

| Git revision | .dodocker | output |
| ------------ | --------- | ------ |
| master ```#1.9.2``` | ```{ repository: 'docker.eg.com', name: 'example' }``` | ```docker image build -tag docker.eg.com/example:1.9.2``` |
| release/1.10.0 | ```{ repository: 'docker.eg.com', name: 'example' }``` | ```docker image build -tag docker.eg.com/example:release_1.10.0``` |
| release/2.0.0 ```#2.0.0-rc.2+asdf``` | ```{ repository: 'docker.eg.com', name: 'example' }``` | ```docker image build -tag docker.eg.com/example:2.0.0-rc.1_asdf``` |
| develop | ```{ repository: 'docker.eg.com', name: 'example' }``` | ```docker image build -tag docker.eg.com/example:develop``` |
| develop | ```{ repository: 'docker.eg.com', scope: 'project', name: 'component' }``` | ```docker image build -tag docker.eg.com/project/component:develop``` |

## Advanced usage:
```javascript
// .dodocker content
module.exports = {
  repository: 'docker.eg.com',
  scope: 'project',
  name: 'component',
  container: 'component',
  port: '8080:80',
  arguments: revision => {
    return ['REVISION=' + (revision.tag ? revision.tag : revision.branch + ' @ ' + revision.commit)];
  }
};
```
```
# git revision master #2.0.0
$ dodocker -pl
ISOTIME -> Executing: docker image build --build-arg REVISION=2.0.0 -tag docker.eg.com/project/component:2.0.0        # always executed (--build-arg from .dodocker arguments)
ISOTIME -> Executing: docker image push docker.eg.com/project/component:2.0.0        # from -p
ISOTIME -> Executing: docker image tag docker.eg.com/project/component:2.0.0 docker.eg.com/project/component:latest   # from -l
ISOTIME -> Executing: docker image push docker.eg.com/project/component:latest       # from -l
$ dodocker -n test1 -r repo.io -s tests
ISOTIME -> Executing: docker image build --build-arg REVISION=2.0.0 -tag repo.io/tests/test1:2.0.0 
$ dodocker -R
ISOTIME -> Executing: docker image build --build-arg REVISION=2.0.0 -tag docker.eg.com/project/component:2.0.0
ISOTIME -> Executing: docker image run -p 8080:80 --name component docker.eg.com/project/component:2.0.0
<IMAGE HASH>
$ dodocker -R -P 80:80 -N test
ISOTIME -> Executing: docker image build --build-arg REVISION=2.0.0 -tag docker.eg.com/project/component:2.0.0
ISOTIME -> Executing: docker image run -p 80:80 --name test docker.eg.com/project/component:2.0.0
<IMAGE HASH>
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
