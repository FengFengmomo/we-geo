import getPixels from 'get-pixels'; // 'get-pixels/dom-pixels'

export class Fetch {
    static api_terrain = "terrain-rgb";
    static api_satellite = "satellite";
    // 获取mapbox的uri链接
    static getUri(api, zoompos) {
        let prefix, res = '', middle;
        switch (api) {
            case 'terrain-rgb':
                prefix = '../map_data/terrain';
                middle = 'terrain_rgb_';
                res = '.png';
                break;
            case 'satellite':
                prefix = '../map_data/tile';
                middle = 'tile_';
                res = '.png';
                // zoompos[0] -=2;
                break;
            default:
                console.log('getUriMapbox(): unsupported api:', api);
                return '';
        }
        // return `${prefix}/${zoompos.join('/')}${res}?access_token=${token}`;
        // return `${prefix}/${zoompos[0]}/${middle}${zoompos.join('_')}${res}`;
        return `${prefix}/${zoompos[0]}/${zoompos[1]}/${zoompos[2]}${res}`;
    }

    // 发送具体的请求
    static async getRgbTile(uri, res) {
        const gp = getPixels;
        gp(uri, (error, pixels) => res(error ? null : pixels));
    }


    // 构造请求并发送
    static fetchTile(uri) {      
        console.log(`uri: ${uri}`);
        const future = res => {
            let ret = null;
            
            ret = this.getRgbTile(uri, res);  // 返回请求的promise              
            
            return ret;
        };

        return new Promise(async (res, _rej) => {
            try {
                const ft = future(res);
                if (ft !== null) {
                    await ft;
                } else {
                    throw new Error(`${tag}: unsupported api: ${uri}`);
                }
            } catch (err) {
                console.warn(`${tag}: err: ${err}`);
                res(null);
            }
        });
    }
}

export default Fetch;