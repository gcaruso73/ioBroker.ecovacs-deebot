'use strict';

const { expect } = require('chai');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

let mockAxios;

const tools = proxyquire('../lib/tools', {
    'axios': (...args) => mockAxios(...args)
});

describe('tools.js - extended edge cases', () => {
    beforeEach(() => {
        mockAxios = sinon.stub();
    });

    describe('translateText', () => {
        it('should return original text for English target with yandex key', async () => {
            const result = await tools.translateText('Hello', 'en', 'some-key');
            expect(result).to.equal('Hello');
            expect(mockAxios.called).to.be.false;
        });

        it('should handle null target language with Google fallback', async () => {
            mockAxios.resolves({ data: [[['Hola']]] });
            const result = await tools.translateText('Hello', null);
            expect(result).to.equal('Hola');
        });
    });

    describe('translateYandex', () => {
        it('should convert zh-cn to zh for Yandex URL', async () => {
            mockAxios.resolves({ data: { text: ['translated'] } });
            await tools.translateText('Hello', 'zh-cn', 'yandex-key');
            const url = mockAxios.firstCall.args[0].url;
            expect(url).to.include('lang=en-zh');
            expect(url).to.not.include('lang=en-zh-cn');
        });

        it('should throw when Yandex response has no text property', async () => {
            mockAxios.resolves({ data: { code: 200 } });
            try {
                await tools.translateText('Hello', 'es', 'yandex-key');
                expect.fail('Should have thrown');
            } catch (e) {
                expect(e.message).to.include('Could not translate');
            }
        });

        it('should return undefined when Yandex response text is empty array', async () => {
            mockAxios.resolves({ data: { text: [] } });
            const result = await tools.translateText('Hello', 'es', 'yandex-key');
            expect(result).to.be.undefined;
        });

        it('should throw when Yandex response data is null', async () => {
            mockAxios.resolves({ data: null });
            try {
                await tools.translateText('Hello', 'es', 'yandex-key');
                expect.fail('Should have thrown');
            } catch (e) {
                expect(e.message).to.include('Could not translate');
            }
        });
    });

    describe('translateGoogle', () => {
        it('should throw when response data is empty array', async () => {
            mockAxios.resolves({ data: [] });
            try {
                await tools.translateText('Hello', 'es');
                expect.fail('Should have thrown');
            } catch (e) {
                expect(e.message).to.include('Could not translate');
            }
        });

        it('should throw when first element of data is empty', async () => {
            mockAxios.resolves({ data: [[]] });
            try {
                await tools.translateText('Hello', 'es');
                expect.fail('Should have thrown');
            } catch (e) {
                expect(e.message).to.include('Could not translate');
            }
        });

        it('should handle HTTP error with status code', async () => {
            mockAxios.rejects({ response: { status: 429 } });
            try {
                await tools.translateText('Hello', 'es');
                expect.fail('Should have thrown');
            } catch (e) {
                expect(e.message).to.include('Could not translate');
            }
        });

        it('should pass timeout 15000 to axios', async () => {
            mockAxios.resolves({ data: [[['translated']]] });
            await tools.translateText('Hello', 'es');
            expect(mockAxios.firstCall.args[0].timeout).to.equal(15000);
        });
    });

    describe('isObject', () => {
        it('should return false for Buffer', () => {
            expect(tools.isObject(Buffer.from('test'))).to.be.false;
        });

        it('should return false for Map and Set', () => {
            expect(tools.isObject(new Map())).to.be.false;
            expect(tools.isObject(new Set())).to.be.false;
        });

        it('should return false for Error', () => {
            expect(tools.isObject(new Error())).to.be.false;
        });
    });

    describe('isArray', () => {
        it('should return false for typed arrays', () => {
            expect(tools.isArray(new Int8Array(2))).to.be.false;
        });

        it('should return false for ArrayBuffer', () => {
            expect(tools.isArray(new ArrayBuffer(8))).to.be.false;
        });
    });
});
