async function initCalendar() {

    const data = await loadData();

    const calendarData = data.map(item => ({
        Id: item.release,
        Subject: item.release,
        StartTime: new Date(item.releaseDate),
        EndTime: new Date(item.releaseDate),
        IsAllDay: true,
        Description: item.descriptionHtml,
        ProjectId: item.attentions?.highlight ? 1 : 0,
        // Release Note Custom Fields
        Title: item.title ?? "",
        Description: item.description ?? "",
        DescriptionHtml: item.descriptionHtml ?? "",
        Release: item.release ?? "",
        ReleaseDate: new Date(item.releaseDate ?? 0),
        Category: item.category ?? "",
        Subcategory: item.subcategory ?? "",
        Source: item.source ?? "",
            

    }));

    const schedule = new ej.schedule.Schedule({
        selectedDate: new Date(),
        width: '100%',
        height: '100%',
        //currentView: "Month",
        views: [{ option: 'Month', showWeekNumber: true, readonly: true }],
        //enablePersistence: true,
        readonly: true,
        eventSettings: {
            dataSource: calendarData,
            fields: {
                id: "Id",
                subject: { name: "Subject" },
                startTime: { name: "StartTime" },
                endTime: { name: "EndTime" },
                description: { name: "Description" },
                ProjectId: { name: "ProjectId " },
            }
        },
        eventRendered: function (args) {
            args.element.classList.add("calendar-event");

            console.log(args);
            if (args.data.ProjectId) {
                args.element.classList.add("calendar-event-highlight");
            }
        },
        popupOpen: (args) => {
            console.log(args)
            if (args.type === 'QuickInfo') {
                args.cancel = true;
                showPopup(`${args?.data.Category ?? ""} (${args?.data.Release ?? ""})`, args?.data.DescriptionHtml ?? "");
                //showPopup(args?.data?.Subject ?? "", args?.data?.Description ?? "");
            }
        }
        /*popupOpen: function (args) {
            if (args.type === "QuickInfo" && args.data && args.data.Description) {

                args.element.querySelector('.e-subject').innerHTML = args.data.Subject;

                const desc = args.element.querySelector('.e-description');
                if (desc) {
                    desc.innerHTML = args.data.Description;
                }
            }

            if (args.type === "Editor") {
                args.cancel = true;
            }
        }*/
    });

    schedule.appendTo("#calendar");
}

initCalendar();