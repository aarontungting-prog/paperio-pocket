import {build} from 'esbuild';
await build({entryPoints:['client-sdk.mjs'],bundle:true,format:'esm',outfile:'dist/vendor.mjs',minify:true});
