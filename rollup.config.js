import strip from '@rollup/plugin-strip';
import typescript from '@rollup/plugin-typescript';

export default [
	{
		input: 'src/main.js',
		
		external: ['three'],
		plugins: [
			strip({
				functions: ['assert.*', 'debug', 'alert', 'console.*']
			}),
			typescript({
				tsconfig: './tsconfig.json'
			})
		],
		output: [
			{
				format: 'es',
				file: 'build/we-geo.module.js',
				indent: '\t'
			},
			{
				format: 'cjs',
				name: 'Geo',
				file: 'build/we-geo.cjs',
				indent: '\t'
			},
			{
				globals: {three: 'THREE'},
				format: 'umd',
				name: 'Geo',
				file: 'build/we-geo.js',
				indent: '\t'
			}
		]
	}
];
