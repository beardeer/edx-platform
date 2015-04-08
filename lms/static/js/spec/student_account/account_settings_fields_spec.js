define(['backbone', 'jquery', 'underscore', 'js/common_helpers/ajax_helpers', 'js/common_helpers/template_helpers',
        'js/views/fields',
        'js/spec/views/fields_helpers',
        'js/spec/student_account/account_settings_fields_helpers',
        'js/student_account/views/account_settings_fields',
        'logger',
        'string_utils'],
    function (Backbone, $, _, AjaxHelpers, TemplateHelpers, FieldViews, FieldViewsSpecHelpers,
              AccountSettingsFieldViewSpecHelpers, AccountSettingsFieldViews, Logger) {
        'use strict';

        describe("edx.AccountSettingsFieldViews", function () {

            var requests,
                timerCallback;

            var EMAIL = 'legolas@woodland.middlearth';

            beforeEach(function () {
                TemplateHelpers.installTemplate('templates/fields/field_readonly');
                TemplateHelpers.installTemplate('templates/fields/field_dropdown');
                TemplateHelpers.installTemplate('templates/fields/field_link');
                TemplateHelpers.installTemplate('templates/fields/field_text');

                timerCallback = jasmine.createSpy('timerCallback');
                jasmine.Clock.useMock();
                spyOn(Logger, 'log');
            });

            it("sends request to reset password on clicking link in PasswordFieldView", function() {
                requests = AjaxHelpers.requests(this);

                var fieldData = FieldViewsSpecHelpers.createFieldData(AccountSettingsFieldViews.PasswordFieldView, {
                    linkHref: '/password_reset',
                    emailAttribute: 'email'
                });

                var view = new AccountSettingsFieldViews.PasswordFieldView(fieldData).render();
                view.$('.u-field-value > a').click();

                // No event was emitted because changeAnalyticsName was not specified.
                expect(Logger.log).not.toHaveBeenCalled();

                AjaxHelpers.expectRequest(requests, 'POST', '/password_reset', "email=legolas%40woodland.middlearth");
                AjaxHelpers.respondWithJson(requests, {"success": "true"});
                FieldViewsSpecHelpers.expectMessageContains(view,
                    "We've sent a message to legolas@woodland.middlearth. Click the link in the message to reset your password."
                );
            });

            it("can emit an event when clicking on reset password link in PasswordFieldView", function() {

                var fieldData = FieldViewsSpecHelpers.createFieldData(AccountSettingsFieldViews.PasswordFieldView, {
                    linkHref: '/password_reset',
                    emailAttribute: 'email',
                    changeAnalyticsName: 'change_initiated',
                    userID: 1000
                });

                var view = new AccountSettingsFieldViews.PasswordFieldView(fieldData).render();
                view.$('.u-field-value > a').click();

                expect(Logger.log).toHaveBeenCalledWith(
                    'change_initiated', {
                        'user_id': 1000,
                        'setting': 'password',
                        'old': null,
                        'new': null
                    }
                );
            });

            it("sends request to /i18n/setlang/ after changing language preference in LanguagePreferenceFieldView", function() {
                requests = AjaxHelpers.requests(this);

                var selector = '.u-field-value > select';
                var fieldData = FieldViewsSpecHelpers.createFieldData(AccountSettingsFieldViews.DropdownFieldView, {
                    valueAttribute: 'language',
                    options: FieldViewsSpecHelpers.SELECT_OPTIONS
                });

                var view = new AccountSettingsFieldViews.LanguagePreferenceFieldView(fieldData).render();

                var data = {'language': FieldViewsSpecHelpers.SELECT_OPTIONS[2][0]};
                view.$(selector).val(data[fieldData.valueAttribute]).change();

                // No event was emitted because changeAnalyticsName was not specified.
                expect(Logger.log).not.toHaveBeenCalled();

                FieldViewsSpecHelpers.expectAjaxRequestWithData(requests, data);
                AjaxHelpers.respondWithNoContent(requests);

                AjaxHelpers.expectRequest(requests, 'POST', '/i18n/setlang/', 'language=' + data[fieldData.valueAttribute]);
                AjaxHelpers.respondWithNoContent(requests);
                FieldViewsSpecHelpers.expectMessageContains(view, "Your changes have been saved.");

                data = {'language': FieldViewsSpecHelpers.SELECT_OPTIONS[1][0]};
                view.$(selector).val(data[fieldData.valueAttribute]).change();
                FieldViewsSpecHelpers.expectAjaxRequestWithData(requests, data);
                AjaxHelpers.respondWithNoContent(requests);

                AjaxHelpers.expectRequest(requests, 'POST', '/i18n/setlang/', 'language=' + data[fieldData.valueAttribute]);
                AjaxHelpers.respondWithError(requests, 500);
                FieldViewsSpecHelpers.expectMessageContains(view, "You must sign out of edX and sign back in before your language changes take effect.");
            });

            it("can emit an event when changing language preference in LanguagePreferenceFieldView", function() {

                var selector = '.u-field-value > select';
                var fieldData = FieldViewsSpecHelpers.createFieldData(AccountSettingsFieldViews.DropdownFieldView, {
                    valueAttribute: 'language',
                    options: FieldViewsSpecHelpers.SELECT_OPTIONS,
                    changeAnalyticsName: 'change_initiated',
                    userID: 1000
                });

                var view = new AccountSettingsFieldViews.LanguagePreferenceFieldView(fieldData).render();

                var newLanguage = FieldViewsSpecHelpers.SELECT_OPTIONS[2][0];
                var data = {'language': newLanguage};
                view.$(selector).val(data[fieldData.valueAttribute]).change();

                expect(Logger.log).toHaveBeenCalledWith(
                    'change_initiated', {
                        'user_id': 1000,
                        'setting': 'language',
                        'old': 'si',
                        'new': newLanguage
                    }
                );
            });

            it("reads and saves the value correctly for LanguageProficienciesFieldView", function() {
                requests = AjaxHelpers.requests(this);

                var selector = '.u-field-value > select';
                var fieldData = FieldViewsSpecHelpers.createFieldData(AccountSettingsFieldViews.DropdownFieldView, {
                    valueAttribute: 'language_proficiencies',
                    options: FieldViewsSpecHelpers.SELECT_OPTIONS
                });
                fieldData.model.set({'language_proficiencies': [{'code': FieldViewsSpecHelpers.SELECT_OPTIONS[0][0]}]});

                var view = new AccountSettingsFieldViews.LanguageProficienciesFieldView(fieldData).render();

                expect(view.modelValue()).toBe(FieldViewsSpecHelpers.SELECT_OPTIONS[0][0]);

                var data = {'language_proficiencies': [{'code': FieldViewsSpecHelpers.SELECT_OPTIONS[1][0]}]};
                view.$(selector).val(FieldViewsSpecHelpers.SELECT_OPTIONS[1][0]).change();
                FieldViewsSpecHelpers.expectAjaxRequestWithData(requests, data);
                AjaxHelpers.respondWithNoContent(requests);
            });

            it("correctly links and unlinks from AuthFieldView", function() {
                requests = AjaxHelpers.requests(this);

                var fieldData = FieldViewsSpecHelpers.createFieldData(FieldViews.LinkFieldView, {
                    title: 'Yet another social network',
                    helpMessage: '',
                    valueAttribute: 'auth-yet-another',
                    connected: true,
                    connectUrl: 'yetanother.com/auth/connect',
                    disconnectUrl: 'yetanother.com/auth/disconnect'
                });
                var view = new AccountSettingsFieldViews.AuthFieldView(fieldData).render();

                AccountSettingsFieldViewSpecHelpers.verifyAuthField(view, fieldData, requests);
            });
        });
    });