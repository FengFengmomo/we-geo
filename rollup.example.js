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
		input: 'src/examples/3dtiles.js',
			plugins: [
					resolve(),
					typescript({
							tsconfig: './tsconfig.examples.json',
					})
			],
			output: [
					{
				format: 'iife',
							file: 'examples/js/3dtiles.js',
							indent: '\t'
					}
		]
	},
	// {
	// 	input: 'src/examples/fakeEarth.js',
	// 	plugins: [
	// 		resolve(),
	// 		typescript({
	// 			tsconfig: './tsconfig.examples.json',
	// 		})
	// 	],
	// 	output: [
	// 		{
	// 			format: 'iife',
	// 			file: 'examples/js/fakeEarth.js',
	// 			indent: '\t'
	// 		}
	// 	]
	// },
	// {
	// 	input: 'src/main.js',
	// 	plugins: [
	// 		resolve(),
	// 		typescript({
	// 			tsconfig: './tsconfig.examples.json',
	// 		})
	// 	],
	// 	output: [
	// 		{
	// 		format: 'es',
	// 		file: 'build/wegeo.module.js',
	// 		indent: '\t'
	// 		},
	// 	]
	// }
];
