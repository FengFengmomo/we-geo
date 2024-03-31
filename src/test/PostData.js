import XHRUtils from '../utils/XHRUtils';

function PostData(url, data, callback) {
    // Default options are marked with *
    XHRUtils.request(url, 'POST',null, data);
}