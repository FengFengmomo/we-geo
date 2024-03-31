import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

export default [
	{
		input: 'src/examples/transition.js',
		plugins: [
			resolve(),
			typescript({
				tsconfig: './tsconfig.examples.json',
			})
		],
		output: [
			{
				format: 'iife',
				file: 'examples/transition.js',
				indent: '\t'
			}
		]
	},
	{
		input: 'src/examples/s101.js',
		plugins: [
			resolve(),
			typescript({
				tsconfig: './tsconfig.examples.json',
			})
		],
		output: [
			{
				format: 'iife',
				file: 'examples/s101.js',
				indent: '\t'
			}
		]
	},
	// {
	// 	input: 'src/examples/providers.js',
	// 	plugins: [
	// 		resolve(),
	// 		typescript({
	// 			tsconfig: './tsconfig.examples.json',
	// 		})
	// 	],
	// 	output: [
	// 		{
	// 			format: 'iife',
	// 			file: 'examples/providers.js',
	// 			indent: '\t'
	// 		}
	// 	]
	// },
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
