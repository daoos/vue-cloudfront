import websocket from '../../../socket/socket';

export const auth = {

    namespaced: true,

    state: {

        /**
         * Session-key which can an and should be used to fetch data or perform actions.<
         * Is used in the nodes store module.
         */
        apikey: null,

        // Timestamp of last authentication
        lastAuthentication: null,

        // Basic session and server informations
        status: null
    },

    actions: {

        async logout() {
            localStorage.removeItem('apikey');
            location.reload(true);
        },

        /**
         * Authenticates a user
         * @param state
         * @param credentials username, password and so on.
         */
        async login({state}, credentials) {
            return this.dispatch('fetch', {
                route: 'login',
                body: credentials
            }).then(({apikey}) => {

                // Save apikey to localstorage and update module
                localStorage.setItem('apikey', apikey);
                state.apikey = apikey;
                state.lastAuthentication = Date.now();

                // Register websocket
                websocket.register(apikey);

                // Jump to home tab
                this.commit('setActiveTab', 'home');

                // Update events and nodes
                return Promise.all([
                    this.dispatch('nodes/update'),
                    this.dispatch('stats/update')
                ]);
            }).then(() => this.dispatch('auth/status'));
        },

        /**
         * Authenticates a user
         * @param state
         * @param credentials username, password and so on.
         */
        async register({state}, credentials) {
            return this.dispatch('fetch', {
                route: 'register',
                body: credentials
            }).then(({apikey}) => {

                // Save apikey to localstorage and update module
                localStorage.setItem('apikey', apikey);
                state.apikey = apikey;

                // Register websocket
                websocket.register(apikey);

                // Jump to home tab
                this.commit('setActiveTab', 'home');

                // Update nodes and perform first-time sync of stats
                return Promise.all([
                    this.dispatch('stats/sync'),
                    this.dispatch('nodes/update')
                ]);
            }).then(() => this.dispatch('auth/status'));
        },

        /**
         * Checks an existing apikey
         * @param state
         * @param apikey
         */
        async key({state}, {apikey}) {
            return this.dispatch('fetch', {
                route: 'checkApiKey',
                body: {apikey}
            }).then(() => {
                state.apikey = apikey;
                state.lastAuthentication = Date.now();

                // Register websocket
                websocket.register(apikey);

                // Update nodes
                return Promise.all([this.dispatch('nodes/update'), this.dispatch('stats/update')]);
            }).then(() => this.dispatch('auth/status')).catch(() => {
                this.dispatch('auth/logout');
            });
        },

        /**
         * Responsible for changing the password or username, if this promise
         * gets rejected String is used as error message.
         *
         * @param state
         * @param currentPassword Current password
         * @param newUsername New username (optional)
         * @param newPassword New passoword (optional)
         * @returns {Promise<void>}
         */
        async updateCredentials({state}, {currentPassword, newUsername, newPassword}) {
            return this.dispatch('fetch', {
                route: 'updateCredentials',
                body: {
                    apikey: state.apikey,
                    currentPassword,
                    newUsername,
                    newPassword
                }
            }).then(() => {

                // Logout
                this.dispatch('auth/logout');
            });
        },

        /**
         * Responsible to delete the accound (and all files)
         *
         * @param password - Current password
         * @returns {Promise<void>}
         */
        async deleteAccount({state}, {password}) {

            // Request user confirmation
            this.commit('dialogbox/show', {
                title: 'Delete account',
                text: 'With this all perma-links, files and folders will be removed. Are you sure? This action cannot be undone, neither your data restored.',
                buttons: [
                    {type: 'cancel', text: 'Cancel'},
                    {type: 'accept', text: 'Okay'}
                ],
                onResolve: index => {
                    if (index) {
                        this.dispatch('fetch', {
                            route: 'deleteAccount',
                            body: {
                                apikey: state.apikey,
                                password
                            }
                        }).then(() => {

                            // Logout
                            this.dispatch('auth/logout');
                        });
                    }
                }
            });
        },

        /**
         * Requests basic session and server informations
         * @param state
         * @returns {Promise<*|Promise<any>>}
         */
        async status({state}) {
            return this.dispatch('fetch', {
                route: 'status',
                body: {apikey: state.apikey}
            }).then(res => {
                state.status = res;
            });
        }
    }
};
