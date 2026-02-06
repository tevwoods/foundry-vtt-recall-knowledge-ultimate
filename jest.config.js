export default {
    testEnvironment: 'node',
    transform: {},
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    testMatch: [
        '**/tests/unit/**/*.test.js',
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/package/',
    ],
    collectCoverageFrom: [
        'package/scripts/**/*.js',
        '!package/scripts/**/*.test.js',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
};
