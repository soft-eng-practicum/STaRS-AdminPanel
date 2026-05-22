import { Component, computed, effect, ElementRef, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PouchdbService } from '../../services/pouchdb.service';
import { Config, MetaConfig } from '../../models/config.model';

@Component({
    selector: 'app-manage-config',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './manage-config.component.html',
    styleUrls: ['./manage-config.component.scss']
})
export class ManageConfigComponent {
    @ViewChild('closeModal') closeModal: ElementRef = null!;
    @ViewChild('closeEditModal') closeEditModal: ElementRef = null!;
    editingConfig = signal<Config | null>(null);
    metaConfig = signal<MetaConfig>(null!);
    loaded = computed(() => this.metaConfig());
    file = signal<File | undefined>(undefined);
    submittingModal = signal<boolean>(false);
    configKeyDisplayNames: { [key: string]: string } = {
        configName: "Config Name",
        secret: "Judging App Password",
        feedbackLink: "Judging App Feedback Link",
        name: "Event Name",
        logo: "Event Logo"
    };
    configTextKeys: (keyof Config)[] = Object.keys(this.configKeyDisplayNames).filter(k => k !== "logo") as (keyof Config)[];
    requiredConfigKeys: (keyof Config)[] = ["configName", "secret"];
    tableConfigKeys: (keyof Config)[] = ["configName", "secret", "name", "feedbackLink"];
    tableConfigHeaders: string[] = [...this.tableConfigKeys.map(k => (this.configKeyDisplayNames as any)[k]), "Event Logo", "Actions"];
    logos = signal<{ [key: string]: string }>({});

    constructor(private pouchdb: PouchdbService) {
        effect(async () => {
            this.metaConfig.set(await pouchdb.getMetaConfig());
        });

        effect(async () => {
            if (!this.metaConfig()) return;
            this.logos.set(Object.fromEntries(await Promise.all(this.metaConfig().configs.filter(c => c.logo).map(async (c) => [c.logo!, await this.getLogoImage(c.logo!)]))));
        });
    }

    async getLogoImage(id: string) {
        const image = await this.pouchdb.getLogo(id);
        return URL.createObjectURL(image as any);
    }

    async onCreateConfig(e: SubmitEvent) {
        try {
            this.submittingModal.set(true);
            const form = e.target as HTMLFormElement;
            const formData = Object.fromEntries(new FormData(form));
            Object.keys(formData).forEach(k => formData[k] = formData[k].toString().trim());
            Object.keys(formData).filter(k => formData[k] === "").forEach(k => delete formData[k]);
            const imageId = crypto.randomUUID();
            const configName: string = formData["configName"] as string;
            const newConfig = { ...formData, postersDB: this.pouchdb.generateDBName(configName, "posters"), judgesDB: this.pouchdb.generateDBName(configName, "judges"), logo: this.file() ? imageId : undefined } as Config;

            for (const requiredKey of this.requiredConfigKeys) {
                if (!newConfig[requiredKey]?.trim()) {
                    this.showToast(`Field "${this.configKeyDisplayNames[requiredKey]}" is required.`, "error");
                    return;
                }
            }

            if (newConfig.configName.length > 200) {
                this.showToast("Config name cannot be longer than 200 characters.", "error");
                return;
            }

            if (!newConfig.configName.match(/^[a-z][a-z0-9_/-]*$/)) {
                this.showToast("Config name must start with a lowercase letter, and can only contain lowercase letters, numbers, or the special characters _, -, or /.", "error", 8000);
                return;
            }

            const metaConfig = this.metaConfig();
            if (metaConfig.configs.some(c => c.configName === newConfig.configName)) {
                this.showToast("A config with that name already exists.", "error");
                return;
            }
            if (this.file()) {
                await this.pouchdb.addLogo(metaConfig, this.file()!, imageId);
            }
            metaConfig.configs.push(newConfig);
            await this.pouchdb.updateMetaConfig(metaConfig);
            this.metaConfig.set(metaConfig);
            form.reset();
            this.closeModal.nativeElement.click();
            this.showToast(`Successfully created config "${formData['configName']}".`, "success");
        } finally {
            this.submittingModal.set(false);
        }
    }

    async onConfirmEditConfig(e: SubmitEvent) {
        try {
            this.submittingModal.set(true);
            const form = e.target as HTMLFormElement;
            const formData = Object.fromEntries(new FormData(form));
            Object.keys(formData).forEach(k => formData[k] = formData[k].toString().trim());
            Object.keys(formData).filter(k => k === "configName" || formData[k] === "").forEach(k => delete formData[k]);
            const newConfig: Config = { ...this.editingConfig()! };
            Object.keys(formData).forEach(k => (newConfig as any)[k] = formData[k]);

            for (const requiredKey of this.requiredConfigKeys) {
                if (!newConfig[requiredKey]?.trim()) {
                    this.showToast(`Field "${this.configKeyDisplayNames[requiredKey]}" is required.`, "error");
                    return;
                }
            }

            const metaConfig = this.metaConfig();
            if (metaConfig.configs.filter(c => c.configName !== this.editingConfig()!.configName).some(c => c.configName === newConfig.configName)) {
                this.showToast("A config with that name already exists.", "error");
                return;
            }

            if (this.file() && !this.editingConfig()!.logo) {
                newConfig.logo = crypto.randomUUID();
            }

            metaConfig.configs[metaConfig.configs.findIndex(c => c.configName === this.editingConfig()!.configName)] = newConfig;
            if (metaConfig.activeConfigName === this.editingConfig()!.configName) {
                metaConfig.activeConfigName = newConfig.configName;
            }

            if (this.file()) {
                if (this.editingConfig()!.logo) {
                    await this.pouchdb.replaceLogo(metaConfig, this.file()!, this.editingConfig()!.logo!);
                } else {
                    await this.pouchdb.addLogo(metaConfig, this.file()!, newConfig.logo!);
                }
            }
            await this.pouchdb.updateMetaConfig(metaConfig);
            this.metaConfig.set({ ...metaConfig });

            setTimeout(() => form.reset(), 150);
            this.closeEditModal.nativeElement.click();
            this.showToast(`Successfully edited config "${newConfig.configName}".`, "success");
        } finally {
            this.submittingModal.set(false);
        }
    }

    onFileSelected(e: Event) {
        this.file.set((e.target as HTMLInputElement).files?.[0]);
    }

    async onActivateConfig(config: Config) {
        const metaConfig = this.metaConfig();
        await this.pouchdb.setActiveConfig(config, metaConfig);
        this.metaConfig.set(metaConfig);
    }

    async onDeleteConfig(config: Config) {
        if (!confirm(`Delete config "${config.configName}"? This will delete all posters and judges associated with this configuration.`)) {
            return;
        }

        const metaConfig = this.metaConfig();
        await this.pouchdb.deleteConfig(metaConfig, config);
        this.metaConfig.set(metaConfig);
    }

    async onEditConfig(config: Config) {
        this.file.set(undefined);
        this.editingConfig.set(config);
    }

    private showToast(message: string, type: "success" | "error", hideDelay: number = 3500): void {
        document.querySelectorAll("div.toast-popup").forEach(d => d.remove());
        const toast = document.createElement("div");
        toast.className = "toast-popup";
        toast.textContent = message;
        toast.style = `position: fixed; top: 5%; left: 50%; transform: translateX(-50%); z-index: 2000; background: ${type === "error" ? "#c0392b" : "#27ae60"}; color: white; padding: 10px 16px; border-radius: 6px; boxShadow: 0 2px 6px rgba(0, 0, 0, 0.2); font-size: 14px; transition: opacity 0.3s ease; opacity: 1;`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, hideDelay);
    }
}
