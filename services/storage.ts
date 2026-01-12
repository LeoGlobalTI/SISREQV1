
import { RequestCard, User } from '../types';
import { INITIAL_USERS, INITIAL_REQUESTS } from '../constants';

const DB_NAME = 'SISREQ_DATABASE';
const DB_VERSION = 1;
const STORE_REQUESTS = 'requests';
const STORE_USERS = 'users';

class DatabaseService {
    private db: IDBDatabase | null = null;

    public async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => {
                console.error("IndexedDB error:", request.error);
                reject(request.error);
            };
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_REQUESTS)) db.createObjectStore(STORE_REQUESTS, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(STORE_USERS)) db.createObjectStore(STORE_USERS, { keyPath: 'id' });
            };
            request.onsuccess = async (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                try {
                    await this.seedData();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
        });
    }

    private async seedData() {
        if (!this.db) return;
        const userCount = await this.count(STORE_USERS);
        if (userCount === 0) {
            const tx = this.db.transaction(STORE_USERS, 'readwrite');
            const store = tx.objectStore(STORE_USERS);
            INITIAL_USERS.forEach(user => store.put(user));
            await new Promise((res, rej) => { 
                tx.oncomplete = res; 
                tx.onerror = () => rej(tx.error);
            });
        }
        const reqCount = await this.count(STORE_REQUESTS);
        if (reqCount === 0) {
            const tx = this.db.transaction(STORE_REQUESTS, 'readwrite');
            const store = tx.objectStore(STORE_REQUESTS);
            INITIAL_REQUESTS.forEach(req => store.put(req));
            await new Promise((res, rej) => { 
                tx.oncomplete = res; 
                tx.onerror = () => rej(tx.error);
            });
        }
    }

    private count(storeName: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB no inicializada.");
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    public async getAll<T>(storeName: string): Promise<T[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB no inicializada.");
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    public async save<T>(storeName: string, item: T): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB no inicializada.");
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(item);
            
            tx.oncomplete = () => resolve();
            tx.onerror = () => {
                console.error(`Error saving to ${storeName}:`, tx.error);
                reject(tx.error);
            };
            request.onerror = () => reject(request.error);
        });
    }

    public async delete(storeName: string, id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("DB no inicializada.");
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    public async getRequests(): Promise<RequestCard[]> { return this.getAll<RequestCard>(STORE_REQUESTS); }
    public async saveRequest(req: RequestCard): Promise<void> { return this.save(STORE_REQUESTS, req); }
    public async deleteRequest(id: string): Promise<void> { return this.delete(STORE_REQUESTS, id); }
    public async getUsers(): Promise<User[]> { return this.getAll<User>(STORE_USERS); }
    public async saveUser(user: User): Promise<void> { return this.save(STORE_USERS, user); }
}

export const db = new DatabaseService();
