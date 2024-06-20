import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

export default [
	// {
	// 	input: 'src/examples/transition.js',
	// 	plugins: [
	// 		resolve(),
	// 		typescript({
	// 			tsconfig: './tsconfig.examples.json',
	// 		})
	// 	],
	// 	output: [
	// 		{
	// 			format: 'iife',
	// 			file: 'examples/transition.js',
	// 			indent: '\t'
	// 		}
	// 	]
	// },
	{
		input: 'src/examples/fakeEarth.js',
		plugins: [
			resolve(),
			typescript({
				tsconfig: './tsconfig.examples.json',
			})
		],
		output: [
			{
				format: 'iife',
				file: 'examples/js/fakeEarth.js',
				indent: '\t'
			}
		]
	},
	// {
	// 	input: 'src/examples/wegeo.js',
	// 	plugins: [
	// 		resolve(),
	// 		typescript({
	// 			tsconfig: './tsconfig.examples.json',
	// 		})
	// 	],
	// 	output: [
	// 		{
	// 			format: 'iife',
	// 			file: 'examples/js/wegeo.js',
	// 			indent: '\t'
	// 		}
	// 	]
	// },
	// {
	// 	input: 'src/examples/waterjson.js',
	// 	plugins: [
	// 		resolve(),
	// 		typescript({
	// 			tsconfig: './tsconfig.examples.json',
	// 		})
	// 	],
	// 	output: [
	// 		{
	// 			format: 'iife',
	// 			file: 'examples/js/waterjson.js',
	// 			indent: '\t'
	// 		}
	// 	]
	// },
	{
		input: 'src/examples/providers.js',
		plugins: [
			resolve(),
			typescript({
				tsconfig: './tsconfig.examples.json',
			})
		],
		output: [
			{
				format: 'iife',
				file: 'examples/providers.js',
				indent: '\t'
			}
		]
	},
	// {
	// 	input: 'src/examples/basic.js',
	// 	plugins: [
	// 		resolve(),
	// 		typescript({
	// 			tsconfig: './tsconfig.examples.json',
	// 		})
	// 	],
	// 	output: [
	// 		{
	// 			format: 'iife',
	// 			file: 'examples/basic.js',
	// 			indent: '\t'
	// 		}
	// 	]
	// }
];
