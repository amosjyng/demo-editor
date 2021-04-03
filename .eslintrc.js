module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "jest": true, // prevent lint errors in test
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:prettier/recommended",
    ],
    "parser": "@babel/eslint-parser",
    "parserOptions": {
        "babelOptions": {
            "presets": ["@babel/preset-react"],
            "plugins": ["@babel/plugin-proposal-class-properties"],
        },
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 12,
        "requireConfigFile": false,
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "@babel",
    ],
    "rules": {
        "react/react-in-jsx-scope": "off" // React import now optional in v17
    },
    "settings": {
        "react": {
            "version": "detect",
        }
    }
};
