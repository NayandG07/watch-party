"""
Blocklist of known disposable / temporary email domains.
Checked during user registration to prevent spam accounts.
"""
from __future__ import annotations

DISPOSABLE_DOMAINS: frozenset[str] = frozenset({
    # Common disposable providers
    "mailinator.com", "guerrillamail.com", "guerrillamail.org", "guerrillamail.net",
    "guerrillamail.biz", "guerrillamail.de", "guerrillamail.info",
    "10minutemail.com", "10minutemail.net", "10minutemail.org",
    "throwam.com", "throwam.net", "trashmail.com", "trashmail.me",
    "trashmail.at", "trashmail.io", "trashmail.net", "trash-mail.at",
    "dispostable.com", "disposableemailaddresses.com", "maildrop.cc",
    "yopmail.com", "yopmail.fr", "cool.fr.nf", "jetable.fr.nf",
    "nospam.ze.tc", "nomail.xl.cx", "mega.zik.dj", "speed.1s.fr",
    "courriel.fr.nf", "moncourrier.fr.nf", "monemail.fr.nf",
    "monmail.fr.nf", "sharklasers.com", "guerrillamailblock.com",
    "grr.la", "guerrillamail.biz", "spam4.me", "spamgourmet.com",
    "spamgourmet.net", "spamgourmet.org", "spamherelots.com",
    "spamhereplease.com", "spamthisplease.com", "tempinbox.com",
    "tempinbox.co.uk", "tempr.email", "temp-mail.org", "temp-mail.io",
    "tempmail.com", "tempmail.net", "tempmail.org", "tempmailer.com",
    "temporaryinbox.com", "throwam.com", "throwam.net",
    "fakeinbox.com", "fakeinbox.net", "fakemailgenerator.com",
    "mailnull.com", "mailnull.net", "mailexpire.com",
    "spamgob.com", "getairmail.com", "filzmail.com",
    "deadaddress.com", "sogetthis.com", "spambox.us",
    "spambox.me", "spamfree24.org", "spamgob.com",
    "spam.la", "spaml.de", "spaml.com", "nospam4.us",
    "mailfreeonline.com", "meltmail.com", "mailnew.com",
    "mailtemp.info", "mail-temp.com", "mail.mezimages.net",
    "mail114.net", "fakemail.fr", "fakemail.net", "fakemail.org",
    "0815.ru", "0815.su", "0clickemail.com", "0-mail.com",
    "007addict.com", "020.co.uk", "0815.ru0clickemail.com",
    "mailboxy.fun", "inboxkitten.com", "mohmal.com",
    "throwam.com", "throwam.net", "throwam.org",
    "safetymail.info", "safetypost.de", "safe-mail.net",
    "mailmetrash.com", "mailin8r.com", "mailinator2.com",
    "mailmetrash.com", "maildrop.cc", "mailbox52.ga",
    "mailbox72.biz", "mailbox80.biz", "mailbox87.de",
    "mailbox92.com", "mailbz.ga", "mailc.net",
    "mailcat.biz", "mailchecker.com", "mailchi.mp",
    "mailcx.cn", "mailde.de", "mailde.info",
    "maildrop.cf", "maildrop.gq", "maildrop.ml",
    "mailexpire.com", "mailf5.com", "mailfall.com",
    "mailfree.ga", "mailfreeonline.com", "mailfs.com",
    "mailguard.me", "mailhazard.com", "mailhazard.us",
    "mailimate.com", "mailin8r.com", "mailinatar.com",
    "mailinator.net", "mailinator.org", "mailinator.us",
    "mailincubator.com", "mailismagic.com", "mailjunk.cf",
    "mailjunk.ga", "mailjunk.gq", "mailjunk.ml",
    "mailjunk.tk", "mailkutu.com", "maillei.de",
    "mailme.gq", "mailme.ir", "mailme24.com",
    "mailmetrash.com", "mailmoat.com", "mailnesia.com",
    "mailnew.com", "mailnull.com", "mailnull.net",
    "mailoj.com", "mailpokemon.com", "mailpoof.com",
    "mailpost.ga", "mailpost.gq", "mailpost.ml",
    "mailpost.tk", "mailquack.com", "mailrock.biz",
    "mailscrap.com", "mailseal.de", "mailsendr.com",
    "mailshell.com", "mailsiphon.com", "mailslapping.com",
    "mailslite.com", "mailsse.com", "mailtechx.com",
    "mailtemp.info", "mailtemp.net", "mailtemp.org",
    "mailtome.de", "mailtothis.com", "mailtown.com",
    "mailtrash.net", "mailzilla.com", "mailzilla.org",
    "makemetheking.com", "manifestgenerator.com", "markmurfin.com",
    "spamgob.com", "spamhereplease.com", "discard.email",
    "discard.ga", "discardmail.com", "discardmail.de",
    "discardmail.ga", "discardmail.gq", "discardmail.ml",
    "dispostable.com", "dodgeit.com", "dodgit.com",
    "dodgit.org", "don-sanchoo.ru", "dontsendmespam.de",
    "dotman.de", "dp76.com", "drdrb.com",
    "drdrb.net", "dump-email.info", "dumpandfuck.com",
    "dumpmail.de", "dumpyemail.com",
    # Temp mail services
    "getnada.com", "getonemail.com", "getonemail.net",
    "guerrillamail.com", "h8s.org", "hackersforcharity.org",
    "haltospam.com", "hatespam.org",
    "hidemail.de", "hidzz.com", "hmail.us",
    "hotpop.com", "humaility.com", "ieatspam.eu",
    "ieatspam.info", "ihateyoualot.info",
    "iheartspam.org", "imails.info", "inboxbear.com",
})


def is_disposable_email(email: str) -> bool:
    """Return True if the email domain is a known disposable provider."""
    try:
        domain = email.split("@", 1)[1].lower().strip()
        return domain in DISPOSABLE_DOMAINS
    except (IndexError, AttributeError):
        return False