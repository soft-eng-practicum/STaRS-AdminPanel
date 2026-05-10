import { Component, computed, effect, ElementRef, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PouchdbService } from '../../services/pouchdb.service';

@Component({
    selector: 'app-manage-config',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './manage-config.component.html',
    styleUrls: ['./manage-config.component.scss']
})
export class ManageConfigComponent {
    @ViewChild('closeModal') closeModal: ElementRef = null!;
    currentConfig = signal<Config>(null!);
    metaConfig = signal<MetaConfig>(null!);
    loaded = computed(() => this.currentConfig() && this.metaConfig());
    file = signal<File | undefined>(undefined);
    submittingModal = signal<boolean>(false);
    configKeyDisplayNames: { [key in keyof Config]: string } = {
        configName: "Config Name",
        postersDB: "Posters Database Name",
        judgesDB: "Judges Database Name",
        secret: "Judging App Password",
        feedbackLink: "Judging App Feedback Link",
        name: "Event Name",
        logo: "Event Logo"
    };
    configTextKeys: (keyof Config)[] = Object.keys(this.configKeyDisplayNames).filter(k => k !== "logo") as (keyof Config)[];
    requiredConfigKeys: (keyof Config)[] = ["configName", "postersDB", "judgesDB", "secret"];
    tableConfigKeys: (keyof Config)[] = ["configName", "postersDB", "judgesDB", "secret", "name", "feedbackLink"];
    tableConfigHeaders: string[] = [...this.tableConfigKeys.map(k => (this.configKeyDisplayNames as any)[k]), "Actions"];

    constructor(private pouchdb: PouchdbService) {
        effect(async () => {
            this.currentConfig.set(await pouchdb.getActiveConfig());
            this.metaConfig.set(await pouchdb.getMetaConfig());
        });
    }

    async onCreateConfig(e: SubmitEvent) {
        try {
            this.submittingModal.set(true);
            const form = e.target as HTMLFormElement;
            const formData = Object.fromEntries(new FormData(form));
            Object.keys(formData).forEach(k => formData[k] = formData[k].toString().trim());
            const imageId = crypto.randomUUID();
            const newConfig = { ...formData, logo: this.file() ? imageId : undefined } as Config;

            for (const requiredKey of this.requiredConfigKeys) {
                if (!newConfig[requiredKey]?.trim()) {
                    this.showToast(`Field "${this.configKeyDisplayNames[requiredKey]}" is required.`, "error");
                    return;
                }
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

    onFileSelected(e: Event) {
        this.file.set((e.target as HTMLInputElement).files?.[0]);
    }

    async onActivateConfig(config: Config) {
        const metaConfig = this.metaConfig();
        this.currentConfig.set(await this.pouchdb.setActiveConfig(config, metaConfig));
        this.metaConfig.set(metaConfig);
    }

    async onDeleteConfig(config: Config) {
        if (!confirm(`Delete config "${config.configName}"?`)) {
            return;
        }

        const metaConfig = this.metaConfig();
        metaConfig.configs = metaConfig.configs.filter(c => c.configName !== config.configName);
        await this.pouchdb.updateMetaConfig(metaConfig);
        this.metaConfig.set(metaConfig);
    }

    private showToast(message: string, type: "success" | "error"): void {
        const toast = document.createElement("div");
        toast.textContent = message;
        toast.style = `position: fixed; top: 5%; left: 50%; transform: translateX(-50%); z-index: 2000; background: ${type === "error" ? "#c0392b" : "#27ae60"}; color: white; padding: 10px 16px; border-radius: 6px; boxShadow: 0 2px 6px rgba(0, 0, 0, 0.2); font-size: 14px; transition: opacity 0.3s ease; opacity: 1;`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}
