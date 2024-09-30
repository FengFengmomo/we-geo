import strip from '@rollup/plugin-strip';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve'

export default [
	{
		input: 'src/main.js',
		
		external: ['three'],
		plugins: [
			strip({
				functions: ['assert.*', 'debug', 'alert', 'console.log*','console.warn*', 'console.info*']
			}),
			typescript({
				tsconfig: './tsconfig.json'
			}),
			resolve({
				browser: true,
			})
		],
		output: [
			{
				format: 'es',
				file: 'build/wegeo.module.js',
				indent: '\t'
			},
			{
				format: 'cjs',
				name: 'Geo',
				file: 'build/wegeo.cjs',
				indent: '\t'
			},
			{
				globals: {three: 'THREE'},
				format: 'umd',
				name: 'Geo',
				file: 'build/wegeo.js',
				indent: '\t'
			}
		]
	}
];
