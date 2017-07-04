import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import "rxjs/add/operator/toPromise";
import * as jsonpath from "jsonpath";
import {Either} from "tsmonad";


/**
 * Service which encapsulates configuration functionalities for apps built with Ionic framework.
 */
@Injectable()
export class ConfigurationService {

	/**
	 * Internal storage of the configuration data.
	 */
	private configValues: { [key: string]: any };

	constructor(private http: Http) {
	}

	/**
	 * Get all available keys.
	 * @returns all available keys
	 */
	public getKeys(): string[] {
		var keys: string[] = [];
		const anykeys: any[] = jsonpath.paths( this.configValues , "*");
		this.getAggregatedKeys( this.configValues , anykeys, keys);
		return keys;
	}
	
	private getAggregatedKeys(currentData: any,anykeys: any[],keys: string[]): string[]{
		if (anykeys !== null) {
			for (let anykey of anykeys) {
				if (anykey == null) {
					continue;
				}
				const currentPath = jsonpath.stringify(anykey);
				const currentAnyKeys: any[] = jsonpath.paths( this.configValues , currentPath+".*");
				if (currentAnyKeys.length > 1){
					this.getAggregatedKeys( currentData , currentAnyKeys, keys)
				}else{
					keys.push(currentPath);
				}
			}
		}
		return keys;
	}

	/**
	 * Get the configuration data for the given key.
	 * @param T type of the returned value (default: object)
	 * @param key key of the configuration data
	 * @returns configuration data for the given key
	 */
	public getValue<T>(key: string): T {
		if (this.configValues !== undefined) {
			return this.configValues[key];
		} else {
			return undefined;
		}
	}

	/**
	 * Loads the configuration from the given url.
	 * @param configurationUrl url from which the configuration should be loaded
	 * @returns promise which gets resolved as soon as the data is loaded; in case of an error, the promise gets rejected
	 */
	public async load(configurationUrl: string): Promise<void> {
		const response = await this.http.get(configurationUrl).toPromise();
		if (response.ok) {
			this.configValues = response.json();
		} else {
			throw new Error(`${configurationUrl} could not be loaded: ${response.status}`);
		}
	}
}
