import { AppPage } from './app.po';
import { browser, logging } from 'protractor';

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getTitleText()).toEqual('STaRS-Admin app is running!');
  });

  it('should display important elements', () => {
    page.navigateTo();

    checkDisplayedEnabled(usernameSearch);
    checkDisplayedEnabled(usernameInput);
    checkDisplayedEnabled(passwordInput);
  });

  it('should block an incorrect login', () => {
    page.navigateTo();

    usernameInput.sendKeys('wronguser');
    passwordInput.sendKeys('wrongpassword');

    submitButton.click();
    browser.sleep(200);
    expect(errorPopup.toString().match('Invalid login credentials'));

  });

  it('should load and display the navigational links', () => {

    elementsToTest.each(function(element) {
      checkDisplayedEnabled(element);
    });

  });


  it('should display data in tables', () => {
    page.navigateTo();

    posterReportLink.click();

    //Make sure the tables aren't empty
    expect(firstPosterTableRow[1].toString().not.match(''));
    expect(firstJudgeTableRow[1].toString().not.match('')); 
    expect (firstCombinedTableRow[1].toString().not.match(''));
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
