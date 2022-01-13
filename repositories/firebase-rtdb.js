const { getApp } = require('firebase/app');
const { getDatabase, ref, onValue } = require('firebase/database');

const OWNERS_PATH = 'owners';
const ADMINS_PATH = 'admins';

const database = getDatabase(getApp());
const ownersRef = ref(database, OWNERS_PATH);
const adminsRef = ref(database, ADMINS_PATH);

var owners = [];
var admins = [];

onValue(ownersRef, (snapshot) => {
    if (snapshot.exists()) {
        let newOwnerList = [];
        const map = new Map(Object.entries(snapshot.val()));
        map.forEach((value, key) => {
            newOwnerList.push(key);
        });
        owners = newOwnerList;
        return;
    }
    owners = [];
});

onValue(adminsRef, (snapshot) => {
    if (snapshot.exists()) {
        let newAdminList = [];
        const map = new Map(Object.entries(snapshot.val()));
        map.forEach((value, key) => {
            newAdminList.push([key]);
        });
        admins = newAdminList;
        return;
    }
    admins = [];
});

function getOwnerList() {
    return owners;
}

function getAdminList() {
    return admins;
}

function getAppDatabase() {
    return database;
}

module.exports = {
    getOwnerList: getOwnerList,
    getAdminList: getAdminList,
    getAppDatabase: getAppDatabase,
    OWNERS_PATH: OWNERS_PATH,
    ADMINS_PATH: ADMINS_PATH
};
