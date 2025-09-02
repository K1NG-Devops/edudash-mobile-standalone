module.exports = function (plop) {
  plop.setGenerator('component', {
    description: 'Create a typed UI component with NativeWind + CVA',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name (e.g., Badge):',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/design-system/components/{{pascalCase name}}.tsx',
        template: "import React from 'react'\nimport { View, Text, ViewProps } from 'react-native'\nimport { cva, type VariantProps } from 'class-variance-authority'\n\nconst {{camelCase name}}Cva = cva('px-2 py-1 rounded-md', {\n  variants: {\n    intent: {\n      neutral: 'bg-slate-200 text-slate-900',\n      primary: 'bg-indigo-600 text-white',\n      success: 'bg-emerald-600 text-white',\n      danger: 'bg-red-600 text-white'\n    },\n    size: {\n      sm: 'text-xs',\n      md: 'text-sm',\n      lg: 'text-base'\n    }\n  },\n  defaultVariants: { intent: 'neutral', size: 'md' }\n})\n\nexport type {{pascalCase name}}Props = ViewProps & VariantProps<typeof {{camelCase name}}Cva> & {\n  children?: React.ReactNode\n}\n\nexport function {{pascalCase name}}({ intent, size, children, ...rest }: {{pascalCase name}}Props) {\n  const className = {{camelCase name}}Cva({ intent, size })\n  return (\n    <View {...rest} className={className}>\n      <Text>{children}</Text>\n    </View>\n  )\n}\n",      },
    ],
  })
}

