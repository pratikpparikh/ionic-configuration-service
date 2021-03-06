﻿// tslint:disable:no-magic-numbers
import { inject, TestBed } from "@angular/core/testing";
import { BaseRequestOptions, Http, Response, ResponseOptions } from "@angular/http";
import { MockBackend, MockConnection } from "@angular/http/testing";

import { ConfigurationService } from "./configuration.service";

describe("ConfigurationService", () => {

	interface ComplexObject {
		prop1: number;
		prop2: string;
	}

	let configurationService: ConfigurationService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				ConfigurationService,
				BaseRequestOptions,
				MockBackend,
				{
					deps: [MockBackend, BaseRequestOptions],
					provide: Http,
					useFactory: (backend: MockBackend, defaultOptions: BaseRequestOptions) => {
						return new Http(backend, defaultOptions);
					},
				},
			],
		});
	});

	beforeEach(inject([MockBackend], (backend: MockBackend) => {
		const configuration = {
			complexObject: {
				"prop1": 1,
				"prop2": "x",
			},
			simpleNumber: 42,
			simpleString: "abc",
			endpointFetch: "http://happypratik.com/api/configuration"
		};
		const httpapiconfiguration = [
			{
				"key":"lscs.project.key",
				"value":"developerlabs"
			},
			{
				"key":"lscs.document.path",
				"value":"/document/path"
			},
			{
				"key":"lscs.v1.url",
				"value":"http://happypratik.com/v1"
			},
			{
				"key":"lscs.cors.enabled",
				"value":"true"
			},
			{
				"key":"lscs.cors.url",
				"value":"http://happypratik.com/corsproxy.php?url="
			}
		];
		const httpapiResponse = new Response(new ResponseOptions({
			body: JSON.stringify(httpapiconfiguration),
			status: 200,
		}));
		const jsonResponse = new Response(new ResponseOptions({
			body: JSON.stringify(configuration),
			status: 200,
		}));
		const textResponse = new Response(new ResponseOptions({
			body: "some text",
			status: 200,
		}));
		const notFoundResponse = new Response(new ResponseOptions({
			status: 404,
		}));
		backend.connections.subscribe((c: MockConnection) => {
			if (c.request.url.endsWith("settings.json")) {
				c.mockRespond(jsonResponse);
			} else if (c.request.url.endsWith("settings.txt")) {
				c.mockRespond(textResponse);
			} else if (c.request.url.endsWith("http://happypratik.com/api/configuration")) {
				c.mockRespond(httpapiResponse);
			}
			else {
				c.mockRespond(notFoundResponse);
			}
		});
	}));

	beforeEach(inject([ConfigurationService],
		(injectedConfigurationService: ConfigurationService) => {
			configurationService = injectedConfigurationService;
		}));

	describe("load(settingsUrl: string): Promise<void>", () => {

		it("returned promise gets resolved when settings is loaded", async (done) => {
			await configurationService.load("settings.json");
			done();
		});

		it("returned promise gets rejected when settings do not exist", async (done) => {
			try {
				await configurationService.load("unknown.json");
			} catch (reason) {
				expect(reason).toEqual(jasmine.any(Error));
				expect(reason.message).toBe("unknown.json could not be loaded: 404");
				done();
			}
		});

		it("returned promise gets rejected when invalid settings is loaded", async (done) => {
			try {
				await configurationService.load("settings.txt");
			} catch (reason) {
				expect(reason).toEqual(jasmine.any(SyntaxError));
				done();
			}
		});
	});

	describe("getValue(key: string,objectPath: boolean = false): any", () => {

		it("returns undefined if configuration is not loaded with objectPath false", () => {
			const value = configurationService.getValue("xxx");
			expect(value).toBeUndefined();
		});

		it("returns value of existing simple string with objectPath false", async (done) => {
			await configurationService.load("settings.json");
			const value = configurationService.getValue<string>("simpleString");
			expect(value).toBe("abc");
			done();
		});

		it("returns value of existing simple number with objectPath false", async (done) => {
			await configurationService.load("settings.json");
			const value = configurationService.getValue<number>("simpleNumber");
			expect(value).toBe(42);
			done();
		});

		it("returns value of existing complex object with objectPath false", async (done) => {
			await configurationService.load("settings.json");
			const value = configurationService.getValue<ComplexObject>("complexObject");
			expect(value.prop1).toBe(1);
			expect(value.prop2).toBe("x");
			done();
		});

		it("returns undefined if key does not exist with objectPath false", async (done) => {
			await configurationService.load("settings.json");
			const value = configurationService.getValue("unknown");
			expect(value).toBeUndefined();
			done();
		});
	});
	
	describe("getValue(key: string,objectPath: boolean = true): any", () => {

		it("returns undefined if configuration is not loaded with objectPath true", () => {
			const value = configurationService.getValue("xxx",true);
			expect(value).toBeUndefined();
		});

		it("returns value of existing simple string with objectPath true", async (done) => {
			await configurationService.load("settings.json");
			const value = configurationService.getValue<string>("simpleString",true);
			expect(value).toBe("abc");
			done();
		});

		it("returns value of existing simple number with objectPath true", async (done) => {
			await configurationService.load("settings.json");
			const value = configurationService.getValue<number>("simpleNumber",true);
			expect(value).toBe(42);
			done();
		});

		it("returns value of existing complex object with objectPath true", async (done) => {
			await configurationService.load("settings.json");
			const value = configurationService.getValue<ComplexObject>("complexObject",true);
			expect(value.prop1).toBe(1);
			expect(value.prop2).toBe("x");
			done();
		});

		it("returns undefined if key does not exist with objectPath true", async (done) => {
			await configurationService.load("settings.json");
			const value = configurationService.getValue("unknown",true);
			expect(value).toBeUndefined();
			done();
		});
	});

	describe("getKeys(): string[]", () => {

		it("returns all keys from settings", async (done) => {
			await configurationService.load("settings.json");
			const keys = configurationService.getKeys();
			expect(keys.length).toBe(4);
			expect(keys).toEqual(['complexObject', 'simpleNumber', 'simpleString', 'endpointFetch']);
			done();
		});
	});
	
	describe("getObjectPaths(): string[]", () => {

		it("returns all objectPaths from settings", async (done) => {
			await configurationService.load("settings.json");
			const objectPaths = configurationService.getObjectPaths();
			expect(objectPaths.length).toBe(14);
			expect(objectPaths).toEqual(['$.complexObject.prop1', '$.complexObject.prop2', '$.simpleNumber', '$.simpleString', '$.endpointFetch[0].key', '$.endpointFetch[0].value', '$.endpointFetch[1].key', '$.endpointFetch[1].value', '$.endpointFetch[2].key', '$.endpointFetch[2].value', '$.endpointFetch[3].key', '$.endpointFetch[3].value', '$.endpointFetch[4].key', '$.endpointFetch[4].value']);
			done();
		});
	});
	
	describe("getObjectPaths(objectPathfilter): string[]", () => {

		it("returns all objectPaths with object path from settings", async (done) => {
			await configurationService.load("settings.json");
			const objectPaths = configurationService.getObjectPaths("complexObject");
			expect(objectPaths.length).toBe(2);
			expect(objectPaths).toEqual(['$.complexObject.prop1', '$.complexObject.prop2']);
			done();
		});
		
		it("returns all objectPaths with json path syntax from settings", async (done) => {
			await configurationService.load("settings.json");
			const objectPaths = configurationService.getObjectPaths("$.complexObject");
			expect(objectPaths.length).toBe(2);
			expect(objectPaths).toEqual(['$.complexObject.prop1', '$.complexObject.prop2']);
			done();
		});
	});
});
