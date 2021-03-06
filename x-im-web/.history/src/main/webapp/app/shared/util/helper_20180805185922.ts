
import { remote, ipcRenderer } from 'electron';
import axios from 'axios';
import MD5 from 'browser-md5-file';

import session from '../stores/session';

import { getSession } from 'app/shared/reducers/authentication';

const CHATROOM_NOTIFY_CLOSE = 0;
const CONTACTFLAG_NOTIFYCLOSECONTACT = 512;
const MM_USERATTRVERIFYFALG_BIZ_BRAND = 8;
const CONTACTFLAG_TOPCONTACT = 2048;
const CONTACTFLAG_CONTACT = 1;

const helper = {
    isContact: (user: any) => {
        if (helper.isFileHelper(user)) return true;

        return user.ContactFlag & CONTACTFLAG_CONTACT
            || (session.user && user.UserName === session.user.User.UserName);
    },

    isChatRoom: (userid: any) => {
        return userid && userid.startsWith('@@');
    },

    isChatRoomOwner: (user: any) => {
        return helper.isChatRoom(user.UserName) && user.IsOwner;
    },

    isChatRoomRemoved: (user: any) => {
        return helper.isChatRoom(user.UserName) && user.ContactFlag === 0;
    },

    isMuted: (user: any) => {
        return helper.isChatRoom(user.UserName) ? user.Statues === CHATROOM_NOTIFY_CLOSE : user.ContactFlag & CONTACTFLAG_NOTIFYCLOSECONTACT;
    },

    isOfficial: (user: any) => {
        return !(user.VerifyFlag !== 24 && user.VerifyFlag !== 8 && user.UserName.startsWith('@'));
    },

    isFileHelper: (user: any) => user.UserName === 'filehelper',

    isTop: (user: any) => {
        if (user.isTop !== void 0) {
            return user.isTop;
        }

        return user.ContactFlag & CONTACTFLAG_TOPCONTACT;
    },

    isBrand: (user: any) => {
        return user.VerifyFlag & MM_USERATTRVERIFYFALG_BIZ_BRAND;
    },

    parseKV: (text: any) => {
        const string = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        const matchs = string.match(/(\w+)="([^\s]+)"/g);
        let res = {};

        matchs.map(e => {
            const kv = e.replace(/"/g, '').split('=');

            res[kv[0]] = kv[1];
        });

        return res;
    },

    parseXml: (text, tagName) => {
        const parser = new window.DOMParser();
        const xml = parser.parseFromString(text.replace(/&lt;/g, '<').replace(/&gt;/g, '>'), 'text/xml');
        const value = {};

        tagName = Array.isArray(tagName) ? tagName : [tagName];

        tagName.map(e => {
            value[e] = xml.getElementsByTagName(e)[0].childNodes[0].nodeValue;
        });

        return { xml, value };
    },

    unique: (arr: any) => {
        const mappings = {};
        const res = [];

        arr.map(e => {
            mappings[e] = true;
        });

        for (const key in mappings) {
            if (mappings[key] === true) {
                res.push(key);
            }
        }

        return res;
    },

    getMessageContent: (message: any) => {
        const isChatRoom = helper.isChatRoom(message.FromUserName);
        const content = message.Content;

        if (isChatRoom && !message.isme) {
            content = message.Content.split(':<br/>')[1];
        }

        switch (message.MsgType) {
            case 1:
                if (message.location) return '[Location]';
                // Text message
                return content.replace(/<br\/>/g, '');

            case 3:
                // Image
                return '[Image]';

            case 34:
                // Image
                return '[Voice]';

            case 42:
                // Contact Card
                return '[Contact Card]';

            case 43:
                // Video
                return '[Video]';

            case 47:
            case 49 + 8:
                // Emoji
                return '[Emoji]';

            case 49 + 17:
                return '🚀 &nbsp; Location sharing, Please check your phone.';

            case 49 + 6:
                return `🚚 &nbsp; ${message.file.name}`;

            case 49 + 2000:
                // Transfer
                return `Money +${message.transfer.money} 💰💰💰`;
        }
    },

    getCookie: async(name: string) => {
        window.console.log('getCookie is empty');
        // const value = {
        //     name
        // };
        // const cookies = remote.getCurrentWindow().webContents.session.cookies;

        // if (!name) {
        //     return new Promise((resolve, reject) => {
        //         cookies.get({ url: axios.defaults.baseURL }, (error, cookies) => {
        //             let string = '';

        //             if (error) {
        //                 return resolve('');
        //             }

        //             for (let i = cookies.length; --i >= 0;) {
        //                 const item = cookies[i];
        //                 string += `${item.name}=${item.value} ;`;
        //             }

        //             resolve(string);
        //         });
        //     });
        // }

        // return new Promise((resolve, reject) => {
        //     cookies.get(value, (err, cookies) => {
        //         if (err) {
        //             reject(err);
        //         } else {
        //             resolve(cookies[0].value);
        //         }
        //     });
        // });
    },

    humanSize: (size: any) => {
        const value = (size / 1024).toFixed(1);

        if (size > (1024 << 10)) {
            value = (value / 1024).toFixed(1);
            return `${value} M`;
        } else {
            return `${value} KB`;
        }
    },

    getFiletypeIcon: (extension: any) => {
        const filename = 'unknow';

        extension = (extension || '').toLowerCase().replace(/^\./, '');

        switch (true) {
            case ['mp3', 'flac', 'aac', 'm4a', 'wma'].includes(extension):
                filename = 'audio';
                break;

            case ['mp4', 'mkv', 'avi', 'flv'].includes(extension):
                filename = 'audio';
                break;

            case ['zip', 'rar', 'tar', 'tar.gz'].includes(extension):
                filename = 'archive';
                break;

            case ['doc', 'docx'].includes(extension):
                filename = 'word';
                break;

            case ['xls', 'xlsx'].includes(extension):
                filename = 'excel';
                break;

            case ['ai', 'apk', 'exe', 'ipa', 'pdf', 'ppt', 'psd'].includes(extension):
                filename = extension;
                break;
        }

        return `${filename}.png`;
    },

    getPallet: (image: any) => {
        return new Promise((resolve, reject) => {
            new window.AlbumColors(image).getColors((colors, err) => {
                if (err) {
                    resolve([
                        [0, 0, 0],
                        [0, 0, 0],
                        [0, 0, 0],
                    ]);
                } else {
                    resolve(colors);
                }
            });
        });
    },

    decodeHTML: (text = '') => {
        return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    },

    isImage: (ext) => {
        return ['bmp', 'gif', 'jpeg', 'jpg', 'png'].includes(ext);
    },

    // 3 types supported: pic, video, doc
    getMediaType: (ext = '') => {
        ext = ext.toLowerCase();

        switch (true) {
            case helper.isImage(ext):
                return 'pic';

            case ['mp4'].includes(ext):
                return 'video';

            default:
                return 'doc';
        }
    },

    getDataURL: (src) => {
        const image = new window.Image();

        return new Promise((resolve, reject) => {
            image.src = src;
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                canvas.width = image.width;
                canvas.height = image.height;

                context.drawImage(image, 0, 0, image.width, image.height);
                resolve(canvas.toDataURL('image/png'));
            };

            image.onerror = () => {
                resolve('');
            };
        });
    },

    isOsx: window.process.platform === 'darwin',

    isSuspend: () => {
        window.console.log('sendSync is-suspend');
    },

    md5: (file) => {
        return new Promise((resolve, reject) => {
            MD5(file, (err, md5) => {
                resolve(err ? false : md5);
            });
        });
    }
};

export default helper;
