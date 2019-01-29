import Vue  from 'vue';
import Vuex from 'vuex';

// Config
import config from '../../../config/config.json';

// Server-related nodes
import {nodes} from './app/nodes';
import {auth}  from './app/auth';
import {stats} from './app/stats';
import {data}  from './app/data';

// Virtual modules act only as visual helpers / representation
import {location}    from './virtual/location';
import {clipboard}   from './virtual/clipboard';
import {selection}   from './virtual/selection';
import {editable}    from './virtual/editable';
import {search}      from './virtual/search/search';
import {tooltip}     from './virtual/tooltip';
import {filepreview} from './virtual/filepreview';
import {share}       from './virtual/share';

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {

        // Holds an array of nodes
        nodes,

        // Holds a session key
        auth,

        // Holds user related content
        stats,

        // Responsible for uploading / downloading data
        data,

        // Holds a single node where you are currently
        location,

        /**
         * Holds an array of nodes which are currently in the clipbord, including a type
         * string which defines whenever it's a copy or move action
         */
        clipboard,

        // Holds an array of nodes which are currently selected
        selection,

        // Holds a single node which is currently editable
        editable,

        // Holds a serch result and is also responsible for performing a search
        search,

        // Holds informations about the current tooltip, is used in combination with the v-tooltip directive
        tooltip,

        // Holds nodes which are currently open in the file preview
        filepreview,

        // Holds nodes which are currently in the share popup
        share
    },

    state: {

        // UI Props
        viewType: 'grid',
        activeTab: 'home',
        activePopup: null,

        // Amount of how many requests are currently active
        requestsActive: 0,

        // Array of routes where requestsActive will not be updated
        ignoredRequestRoutes: ['createFolders']
    },

    getters: {

        /**
         * Returns a function which takes a node which returns
         * a url to this specific file using the current APIKey.
         *
         * @returns {function(*): string}
         */
        buildStaticUrl(state) {
            return node => `${config.apiEndPoint}/s/${encodeURIComponent(node.name)}?id=${node.id}&apikey=${state.auth.apikey}`;
        }
    },

    mutations: {

        setActivePopup(state, popup) {
            state.activePopup = popup;
        },

        setActiveTab(state, tab) {
            state.activeTab = tab;
        },

        setViewType(state, type) {
            state.viewType = type;
        }
    },

    actions: {

        /**
         * Request proxy
         *
         * @param state
         * @param route API endpoint
         * @param body JSON Bddy
         * @returns {Promise<Response | Never>}
         */
        async fetch({state}, {route, body}) {

            if (!navigator.onLine) {
                return Promise.reject('User is currently offline');
            }

            !state.ignoredRequestRoutes.includes(route) && state.requestsActive++;
            return fetch(`${config.apiEndPoint}/${route}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            }).then(async v => {

                if (!v.ok) {

                    /* eslint-disable no-console */
                    console.warn(v);
                    throw 'Fetch failed';
                }

                const {error, data} = await v.json();
                !state.ignoredRequestRoutes.includes(route) && state.requestsActive--;

                if (error) {
                    throw error;
                }

                return data;
            });
        }
    }
});
