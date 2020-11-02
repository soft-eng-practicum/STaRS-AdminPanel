import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo(): Promise<unknown> {
    return browser.get(browser.baseUrl) as Promise<unknown>;
  }

  getTitleText(): Promise<string> {
    return element(by.css('app-root .content span')).getText() as Promise<string>;
  }

  checkDisplayedEnabled(e) {
    e.isDisplayed();
    e.isEnabled();
  }

  usernameSearch = element(by.id('search'));
  usernameInput = element(by.id('username'));
  passwordInput = element(by.id('password'));

  errorPopup = element(by.className('toast toast-error'));

  //Need the submit button...not sure if this will work?
  submitButton = element(by.buttonText('submit'));;

  dashboardLink = element(by.css('[ui-sref="dashboard"]'));
  posterReportLink = element(by.css('[ui-sref="posterList"]'));
  judgeReportLink = element(by.css('[ui-sref="judgeList"]'));
  combinedReportLink = element(by.css('[ui-sref="finalReport"]'));

  elementsToTest = [this.dashboardLink, this.posterReportLink, this.judgeReportLink, this.combinedReportLink];

  firstPosterTableRow = element.all(by.repeater('poster in posters')).first();
  firstJudgeTableRow = element.all(by.repeater('judge in judges')).first();
  firstCombinedTableRow = element.all(by.repeater('col in colContainer.renderedColumns track by col.ui')).first();
}
