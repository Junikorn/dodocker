const cp = require('child_process');
const path = require('path');
const fs = require('fs');

function spawn(cfg, connect){
  return new Promise((resolve, reject) => {
    const p = cp.spawn(cfg.cmd, cfg.args);
    if(connect){
      p.stdout.pipe(process.stdout);
      p.stderr.pipe(process.stderr);
    }
    p.on('close', code => {
      if(code){
        reject(code);
      }else{
        resolve();
      }
    });
  });
}

function exec(cmd){
  return new Promise((resolve, reject) => {
    cp.exec(cmd, { cwd: process.cwd() }, function(err, stdout, stderr){
      if(err){
        reject(stderr);
      }else{
        resolve(stdout);
      }
    });
  });
}

const gitCommands = {
  short: 'git rev-parse --short HEAD',
  long: 'git rev-parse HEAD',
  branch: 'git rev-parse --abbrev-ref HEAD',
  lastTag: 'git describe --always --tag --abbrev=0',
  tag: 'git describe --exact-match --tags HEAD'
};
function gitRev(type){
  const cmd = gitCommands[type];
  return cmd && exec(cmd).then(rev => rev.split('\n').join(''), () => false) ||
    Promise.reject(Error('No such rev type'));
}

function getRevision(){
  return gitRev('short').then(commit => {
    return gitRev('branch').then(branch => {
      return gitRev('tag').then(tag => ({
        commit,
        branch,
        tag
      }));
    });
  });
}

function getConfig(file){
  return new Promise(resolve => {
    const defaultCfg = require(path.resolve(__dirname, '.dodocker'));
    file = file || path.resolve(process.cwd(), '.dodocker');
    fs.access(file, err => {
      if(err){
        resolve(defaultCfg);
      }else{
        resolve(Object.assign(defaultCfg, require(file)));
      }
    });
  });
}

function getBuildTag(config, tag){
  const tagComposer = [];
  tagComposer.push(config.repository);
  if(config.scope){
    tagComposer.push('/' + config.scope);
  }
  tagComposer.push('/' + config.name);
  tagComposer.push(':' + tag);
  return tagComposer.join('');
}

function getBuildCfg(config, tag){
  const buildTag = getBuildTag(config, tag);
  const buildArgs = config.arguments && config.arguments(config.revision);
  const args = [
    'build',
    '--tag', buildTag
  ];
  if(buildArgs){
    buildArgs.forEach(arg => {
      args.push('--build-arg');
      args.push(arg);
    });
  }
  args.push('.');
  return { cmd: 'docker', args, tag: buildTag };
}

function logCommand(cfg){
  console.log(new Date().toISOString() + ' -> Executing: ' + cfg.cmd + ' ' + cfg.args.join(' '));
}

function runNext(queue){
  const cfg = queue.shift();
  if(cfg){
    logCommand(cfg);
    return spawn(cfg, true).then(() => runNext(queue), err => {
      throw err
    });
  }else{
    return Promise.resolve(true);
  }
}

const program = require('commander');

program
  .version(require('./package').version)
  .option('-c, --config', 'Path to config file (if different than .dodocker)')
  .option('-p, --push', 'Push image to repository')
  .option('-l, --latest', 'Push as latest')
  .option('-r, --repository [repository]', 'Docker repository')
  .option('-n, --image-name [image-name]', 'Docker image name')
  .parse(process.argv);

Promise.all([
  getConfig(program.config),
  getRevision()
]).then(resolutions => {
  const config = resolutions[0];
  config.repository = program.repository || config.repository;
  config.name = program.imageName || config.name;
  const revision = config.revision = resolutions[1];
  const revisionTag = config.tag && config.tag.predicate(revision.tag) && config.tag.format(revision.tag) ||
    config.branch && config.branch.predicate(revision.branch) && config.branch.format(revision.branch) ||
    revision.commit;
  const build = getBuildCfg(config, revisionTag);
  const queue = [build];
  if(program.push){
    queue.push({ cmd: 'docker', args: ['push', build.tag] });
  }
  if(program.latest){
    const latestTag = getBuildTag(config, 'latest');
    queue.push({ cmd: 'docker', args: ['tag', build.tag, latestTag]});
    queue.push({ cmd: 'docker', args: ['push', latestTag] });
  }
  runNext(queue).then(() => process.exit(0));
});

