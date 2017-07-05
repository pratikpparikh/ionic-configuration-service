import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import "rxjs/add/operator/toPromise";
import * as jsonpath from "jsonpath";
import * as isUrl from "is-url";


/**
 * Service which encapsulates configuration functionalities for apps built with Ionic framework.
 */
@Injectable()
export class ConfigurationService {

	/**
	 * Internal storage of the configuration data.
	 */
	private configValues: { [key: string]: any };
	
	private configUrls: string[] = [];
	
	private objectPaths: string[] = [];
	
	private keys: string[] = [];

	constructor(private http: Http) {
	}
	
	public getConfigurationUrls(){
		return this.configUrls;
	}

	/**
	 * Get all available keys.
	 * @returns all available keys
	 */
	public getKeys(): string[] {
		return this.keys;
	}
	
	/**
	 * Get all available object paths.
	 * @param objectPathfilter objectPathfilter if specified then 
	 *        will only return the paths that exist under filtered
	 *        path.
	 * @returns all available object paths
	 */
	public getObjectPaths(objectPathfilter: string = null): string[] {
		let paths: string[] = [];
		if (typeof objectPathfilter === 'undefined' || objectPathfilter === null){
			paths = this.objectPaths;
		} else {
			paths = this.objectPaths.filter(function (element, index, array) {
			   return element.startsWith(objectPathfilter.startsWith('$.') ? objectPathfilter : '$.' + objectPathfilter);
			});
		}
		return paths;
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
	public async load(configurationUrl: string,currentPath: string = null,originalObject: any = null): Promise<void> {
		if ( this.configUrls.indexOf(configurationUrl) !== -1){
			return;
		}
		const response = await this.http.get(configurationUrl).toPromise();
		if (response.ok) {
			this.configUrls.push(configurationUrl);
			let originalResponse = response.json();
			if(typeof originalObject === 'undefined' || originalObject === null){
				originalObject = originalResponse;
				for (const key in originalObject) {
					if (this.keys.indexOf(key) !== -1)
					{
						continue;
					}
					this.keys.push(key);
				}
			}else if (currentPath !== null && originalObject !== null){
				// update originalObject at currentPath with the originalResponse.
				jsonpath.value(originalObject,currentPath,originalResponse);
			}
			const anykeys: any[] = jsonpath.paths( originalObject , "*");
			this.configValues = await this.loadAggregatedValues( originalObject, anykeys, this.configUrls,this.objectPaths);
			console.log(this.configValues);
		} else {
			throw new Error(`${configurationUrl} could not be loaded: ${response.status}`);
		}
	}
	
	private loadAggregatedValues(currentData: any,anykeys: any[],configurationUrls: string[],objectPaths: string[]): string[]{
		if (anykeys !== null) {
			for (let anykey of anykeys) {
				if (anykey == null) {
					continue;
				}
				const currentPath = jsonpath.stringify(anykey);				
				const currentAnyKeys: any[] = jsonpath.paths( currentData , currentPath+".*");
				if (currentAnyKeys.length > 1){
					this.loadAggregatedValues( currentData, currentAnyKeys, configurationUrls, objectPaths)
				}else{
					const currentValue =jsonpath.value( currentData, currentPath);
					if (isUrl(currentValue) && currentPath.endsWith("Fetch")){
						this.load(currentValue,currentPath,currentData);
					}else if (objectPaths.indexOf(currentPath) === -1) {						
						objectPaths.push(currentPath);
					}
				}
			}
		}
		return currentData;
	}
}